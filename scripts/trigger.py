#!/usr/bin/env python3
"""BuyTCN Blog 自动发布（方案 B 变体：生成放在 GitHub Actions）。

职责链路：
  1. 拉取站点选题池（GET /api/blog/admin?all=1，需 BLOG_ADMIN_TOKEN）
  2. 选一个最少使用、且与现有 slug/标题不重复的 active 选题
  3. 在 Actions 内直连 Agnes（无 Cloudflare 数据中心 429 问题）生成 正文+SEO
     —— prompt 与站点后台 AI 生成器同族
  4. 本地质检：字数>=600、无 AI 套话开头、slug 唯一
  5. 调站点 admin 接口保存为 DRAFT；dry_run=false 时再 publish
  6. 通知 + 非 0 退出码让 Actions 标红

环境变量：
  BLOG_ADMIN_TOKEN  必填。站点管理 token
  AGNES_BASE_URL    必填，默认 https://apihub.agnes-ai.com/v1
  AGNES_API_KEY      必填。Agnes 平台创建
  AGNES_MODEL        必填，默认 agnes-2.5-flash
  DRY_RUN            true/false，默认 true（只存 DRAFT，不发布）
  NOTIFY_URL         可选 webhook
  SITE               默认 https://www.buytcn.com
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

SITE = os.environ.get("SITE", "https://www.buytcn.com").rstrip("/")
AGNES_BASE = os.environ.get("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1").rstrip("/")
AGNES_KEY = os.environ.get("AGNES_API_KEY", "").strip()
AGNES_MODEL = os.environ.get("AGNES_MODEL", "agnes-2.5-flash").strip()
DRY_RUN = os.environ.get("DRY_RUN", "true").strip().lower() != "false"
TOKEN = os.environ.get("BLOG_ADMIN_TOKEN", "").strip()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

BANNED_OPENERS = [
    "in today's fast-paced world", "in today’s fast-paced world",
    "in the ever-evolving landscape", "in the ever-evolving world",
    "in an era where", "in today's digital age",
]


def notify(msg: str) -> None:
    url = os.environ.get("NOTIFY_URL", "").strip()
    if not url:
        return
    try:
        req = urllib.request.Request(url, data=json.dumps({"msg": msg}).encode(),
                                     headers={"Content-Type": "application/json"}, timeout=10)
        urllib.request.urlopen(req)
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] 通知失败: {exc}")


def api(path: str, payload: dict | None = None, method: str = "POST", timeout: int = 60, auth: bool = True) -> dict:
    """调站点 API。auth=True 时带 BLOG_ADMIN_TOKEN；公开读接口可 auth=False。"""
    url = SITE + path
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json", "User-Agent": UA}
    if auth and TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    last = None
    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode()[:160]}"
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__}: {e}"
        time.sleep(5 * attempt)
    raise SystemExit(f"站点 API 调用失败 {method} {path}: {last}")


def agnes_chat(system: str, user: str, timeout: int = 240) -> str:
    """直连 Agnes（OpenAI 兼容），带退避重试。"""
    if not AGNES_KEY:
        raise SystemExit("缺少 AGNES_API_KEY")
    url = AGNES_BASE + "/chat/completions"
    body = json.dumps({
        "model": AGNES_MODEL,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.6,
    }).encode()
    last = ""
    for attempt in range(1, 5):
        try:
            req = urllib.request.Request(url, data=body, headers={
                "Content-Type": "application/json", "User-Agent": UA,
                "Authorization": "Bearer " + AGNES_KEY})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                d = json.loads(r.read().decode())
                return (d.get("choices") or [{}])[0].get("message", {}).get("content", "")
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}: {e.read().decode()[:160]}"
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__}: {e}"
        time.sleep(8 * attempt)
    raise SystemExit(f"Agnes 调用失败（尝试 4 次）: {last}")


def slugify(s: str) -> str:
    import re
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower().strip()).strip("-")
    return s[:90]


def strip_html(h: str) -> str:
    import re
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", h or "")).strip()


def choose_topic(posts: list, topics: list) -> dict | None:
    """挑一个：article_count 最小 + priority 最高 + 与现有 slug/标题不重复。"""
    have_slugs = {p.get("slug") for p in posts}
    have_titles = {(p.get("title") or "").lower() for p in posts}

    def kw_hits(kw: str, titles: set) -> bool:
        words = [w for w in (kw or "").lower().split() if len(w) > 2]
        # 标题包含关键词任意连续 2 个词 => 视为已覆盖
        for i in range(len(words) - 1):
            pair = words[i] + " " + words[i + 1]
            if any(pair in tt for tt in titles):
                return True
        return False

    pool = [t for t in topics if t.get("status") == "active"]
    pool.sort(key=lambda t: (t.get("article_count") or 0, -(t.get("priority") or 0)))
    for t in pool:
        slug = slugify(t.get("keyword") or t.get("topic"))
        if slug in have_slugs or kw_hits(t.get("keyword") or "", have_titles):
            continue
        return t
    return None


def quality_check(title: str, content: str) -> list:
    issues = []
    wc = len(strip_html(content).split())
    if wc < 600:
        issues.append(f"字数不足({wc}<600)")
    low = strip_html(content).lower()
    for b in BANNED_OPENERS:
        if b in low[:400]:
            issues.append(f"AI 套话开头: {b}")
    if low.count("in conclusion") > 1:
        issues.append("结论重复")
    return issues


def main() -> int:
    if not TOKEN:
        print("缺少 BLOG_ADMIN_TOKEN", file=sys.stderr)
        return 1

    # 1) 拉现有文章（公开接口，一次全量，无需 admin）用于去重 + internal_links
    pub = api("/api/blog/posts?limit=200", method="GET", timeout=40, auth=False)
    posts = pub.get("posts") or []
    # 同时拉选题池（需 admin）
    admin = api("/api/blog/admin?all=1", method="GET", timeout=40, auth=True)
    topics = admin.get("topics") or []

    # internal_links 候选：以 slug/title 提供，按类别相关优先挑 2 个
    def link_candidates(category: str, keyword: str, exclude_slug: str, limit: int = 2) -> list:
        kw = [w for w in (keyword or "").lower().split() if len(w) > 3]
        scored = []
        for p in posts:
            if p.get("slug") == exclude_slug:
                continue
            hay = ((p.get("title") or "") + " " + (p.get("category") or "")).lower()
            s = 0
            if category and category.lower() in hay:
                s += 2
            s += sum(1 for w in kw if w in hay)
            if s > 0:
                scored.append((s, p.get("slug"), p.get("title")))
        scored.sort(reverse=True)
        return [{"slug": s, "title": t} for _, s, t in scored[:limit]]

    topic = choose_topic(posts, topics)
    if not topic:
        print("选题池已全部用过/无可用选题，跳过。")
        return 0
    print(f"选题: {topic.get('topic')}  (kw={topic.get('keyword')})")

    # 2) Agnes 生成（一次返回完整 schema 字段）
    sys_p = (
        "You are the editorial writer and SEO editor for BuyTCN, a China shopping/sourcing agent "
        "for US buyers (Taobao/1688/PDD purchasing, QC photos, consolidation, worldwide shipping). "
        "Write an original, practical, SEO-aware article. Do NOT rewrite any single source. "
        "Do not invent facts, statistics or customer stories. No unsupported savings/shipping/quality "
        "claims. Natural US English. Avoid AI-sounding openers."
    )
    user_p = (
        f"Topic: {topic.get('topic')}\nCategory: {topic.get('category')}\n"
        f"Primary keyword: {topic.get('keyword')}\n"
        "Existing internal-link candidates (choose the 2 most relevant by topic, never force):\n"
        + "\n".join(f"- /blog/{p.get('slug')} | {p.get('title')}" for p in posts[:12]) + "\n"
        "Target ~900-1300 words. Body must be clean HTML (h2/h3/p/ul/li). Natural placement of "
        "BuyTCN services (agent purchasing, QC photos before shipping, consolidation) at most twice. "
        "Return ONLY JSON with exactly these keys:\n"
        '{"content":"html body","title":"<=70 chars","slug":"lowercase-hyphen",'
        '"excerpt":"<=200 chars","seo_title":"<=60 chars","meta_description":"150-160 chars",'
        '"secondary_keywords":["kw2","kw3","kw4"],'
        '"faq":[{"q":"question","a":"answer"}](2-3 items),'
        '"internal_links":[{"slug":"existing-slug"}](1-2 from candidates above, omit if none fit)}'
    )
    raw = agnes_chat(sys_p, user_p)
    try:
        gen = json.loads(raw.replace("```json", "").replace("```", "").strip())
    except Exception:
        print("Agnes 返回非 JSON：", raw[:300], file=sys.stderr)
        notify("❌ BuyTCN Blog 生成失败：非 JSON 响应")
        return 1

    content = str(gen.get("content") or "")
    title = str(gen.get("title") or topic.get("topic"))[:110]
    slug = slugify(gen.get("slug") or topic.get("keyword") or topic.get("topic"))
    excerpt = str(gen.get("excerpt") or strip_html(content)[:160])
    seo_title = str(gen.get("seo_title") or title)[:60]
    meta_desc = str(gen.get("meta_description") or excerpt)[:200]
    secondary = gen.get("secondary_keywords") or []
    if not isinstance(secondary, list):
        # 兼容"空格分隔字符串"输入
        secondary = str(secondary).split()
    secondary = [str(s).strip() for s in secondary if str(s).strip()][:8]
    faq = gen.get("faq") or []
    if not isinstance(faq, list) or not all(isinstance(x, dict) for x in faq):
        faq = []
    faq = [{"q": str(x.get("q", ""))[:160], "a": str(x.get("a", ""))[:800]} for x in faq if x.get("q")]
    gen_links = gen.get("internal_links") or []
    internal_links = []
    for x in (gen_links if isinstance(gen_links, list) else [])[:2]:
        s = str((x or {}).get("slug", ""))
        if s.startswith("/blog/"):
            s = s[len("/blog/"):]
        s = s.split("?")[0].strip("/")
        if s and s != slug:
            internal_links.append({"slug": s})
    # 若 Agnes 没给出合适内链，退回到类别相关匹配
    if not internal_links:
        for c in link_candidates(topic.get("category", ""), topic.get("keyword", ""), slug, 2):
            internal_links.append({"slug": c["slug"]})

    # 3) 质检
    issues = quality_check(title, content)
    if not faq:
        issues.append("缺少 FAQ 字段")
    if issues:
        print("质检未过：", issues, file=sys.stderr)
        notify(f"❌ BuyTCN Blog 质检未过: {title} -> {issues}")
        return 1

    wc = len(strip_html(content).split())

    # 4) 保存 DRAFT（服务端会补 reading_time/word_count；这里显式给齐 SEO 字段）
    post_obj = {
        "title": title, "slug": slug, "excerpt": excerpt, "category": topic.get("category"),
        "author": "BuyTCN Editorial Team", "featured_image": None, "content": content,
        "seo_title": seo_title, "seo_description": meta_desc,
        "primary_keyword": topic.get("keyword") or "", "secondary_keywords": secondary,
        "sources": [], "faq": faq, "internal_links": internal_links,
        "tags": [topic.get("category", "")],
    }
    saved = api("/api/blog/admin", {"action": "save", "token": TOKEN, "post": post_obj}, auth=True)
    if not saved.get("ok"):
        print("保存失败：", saved, file=sys.stderr)
        return 1
    post_id = saved["post"]["id"]
    quality_score = saved.get("post", {}).get("quality_score")

    # 5) dry_run=false 时发布
    published = False
    if not DRY_RUN:
        pub2 = api("/api/blog/admin", {"action": "publish", "token": TOKEN, "id": post_id}, auth=True)
        if pub2.get("ok"):
            published = True
        else:
            print("发布失败：", pub2, file=sys.stderr)
            notify(f"⚠️ BuyTCN Blog 草稿已存但发布失败: {title}")
            return 1

    status = "PUBLISHED" if published else "DRAFT"
    print(f"标题: {title}\nslug: {slug}\n状态: {status}\n字数: {wc}\n质量分: {quality_score}")
    notify(f"{'✅' if published else '📝'} BuyTCN Blog {'已发布' if published else '已存草稿'}: {title} /blog/{slug} [{status}]")
    return 0


if __name__ == "__&#8203;main__":
    sys.exit(main())
