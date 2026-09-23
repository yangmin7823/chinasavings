/**
 * BuyTCN Blog — 共享存储层与工具函数
 *
 * KV binding: BLOG（wrangler.toml 里配置）
 * 键：posts（数组）、topics（数组）
 * 若 KV 未绑定，退回进程内存（仅本地预览用，线上必须绑 KV）。
 */

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })

export const ok = (data = {}) => json({ ok: true, ...data })
export const fail = (error, status = 400) => json({ ok: false, error }, status)

export function handleOptions(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS })
  return null
}

/* --------------------------------------------------------------- 存储 */

const MEM = (globalThis.__BLOG_MEM ||= { posts: null, topics: null })

async function kvGet(env, key) {
  if (env?.BLOG?.get) {
    const v = await env.BLOG.get(key)
    return v ? JSON.parse(v) : null
  }
  return MEM[key] ?? null
}

async function kvPut(env, key, value) {
  if (env?.BLOG?.put) {
    await env.BLOG.put(key, JSON.stringify(value))
    return
  }
  MEM[key] = value
}

export async function loadPosts(env) {
  const v = await kvGet(env, 'posts')
  return Array.isArray(v) ? v : []
}

export async function savePosts(env, posts) {
  await kvPut(env, 'posts', posts)
  return posts
}

export async function loadTopics(env) {
  const v = await kvGet(env, 'topics')
  if (Array.isArray(v) && v.length) return v
  await kvPut(env, 'topics', DEFAULT_TOPICS)
  return DEFAULT_TOPICS
}

export async function saveTopics(env, topics) {
  await kvPut(env, 'topics', topics)
  return topics
}

/* ----------------------------------------------------------- 选题池 */

export const DEFAULT_TOPICS = [
  { topic: 'How to buy from Taobao in the USA', keyword: 'how to buy from taobao usa', category: 'Taobao & 1688', status: 'active', priority: 10, article_count: 0 },
  { topic: '1688 vs Alibaba for sourcing', keyword: '1688 vs alibaba sourcing', category: 'Taobao & 1688', status: 'active', priority: 9, article_count: 0 },
  { topic: 'What is a 1688 agent', keyword: 'what is a 1688 agent', category: 'Taobao & 1688', status: 'active', priority: 8, article_count: 0 },
  { topic: 'How to find reliable Chinese suppliers', keyword: 'reliable chinese suppliers', category: 'Suppliers & Manufacturers', status: 'active', priority: 8, article_count: 0 },
  { topic: 'Private label manufacturing in China', keyword: 'private label manufacturing china', category: 'Suppliers & Manufacturers', status: 'active', priority: 7, article_count: 0 },
  { topic: 'China factory sourcing for small importers', keyword: 'china factory sourcing small importers', category: 'Suppliers & Manufacturers', status: 'active', priority: 7, article_count: 0 },
  { topic: 'Consolidating packages from China', keyword: 'consolidate packages china shipping', category: 'Shipping & Import', status: 'active', priority: 6, article_count: 0 },
  { topic: 'Understanding import duties when buying from China', keyword: 'import duties buying from china', category: 'Shipping & Import', status: 'active', priority: 6, article_count: 0 },
  { topic: 'How to read QC photos before shipping', keyword: 'qc photos china inspection', category: 'Buying From China', status: 'active', priority: 5, article_count: 0 },
  { topic: 'Weidian for international buyers', keyword: 'weidian international buyers guide', category: 'Taobao & 1688', status: 'active', priority: 5, article_count: 0 },
  { topic: 'Buying from Pinduoduo as an overseas buyer', keyword: 'pinduoduo overseas buyer', category: 'Taobao & 1688', status: 'active', priority: 4, article_count: 0 },
  { topic: 'How to choose a China shopping agent', keyword: 'choose china shopping agent', category: 'Buying From China', status: 'active', priority: 4, article_count: 0 },
]

/* ----------------------------------------------------------- 工具函数 */

export const uid = () => crypto.randomUUID()

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

export const stripHtml = (h) =>
  String(h || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const countWords = (h) => stripHtml(h).split(/\s+/).filter(Boolean).length

export const readingTime = (h) => Math.max(2, Math.round(countWords(h) / 220))

/**
 * 轻量质量分（0-100）。用于后台与自动发布链路给编辑一个参考值。
 * 打分维度与 scripts/trigger.py 的质检规则保持一致：
 *   字数 / 小标题结构 / FAQ / 内链 / SEO 字段 / 是否含 AI 套话开头
 */
export function qualityScore(post = {}) {
  const content = String(post.content || '')
  const words = countWords(content)
  let s = 0

  // 字数（40 分）：>=1200 满分，线性到 400 词
  s += Math.round(Math.min(1, Math.max(0, (words - 400) / 800)) * 40)

  // 结构（20 分）：h2 数量
  const h2 = (content.match(/<h2\b/gi) || []).length
  s += Math.min(h2, 4) * 5

  // FAQ（15 分）
  s += Math.min((Array.isArray(post.faq) ? post.faq.length : 0), 3) * 5

  // 内链（10 分）
  s += Math.min((Array.isArray(post.internal_links) ? post.internal_links.length : 0), 2) * 5

  // SEO 字段（10 分）
  if (post.seo_title) s += 5
  if (post.seo_description) s += 5

  // 套话开头（5 分）
  const head = stripHtml(content).slice(0, 120).toLowerCase()
  const banned = ["in today's fast-paced world", 'in the ever-evolving', 'in an era where', "in today's digital age"]
  if (!banned.some((b) => head.includes(b))) s += 5

  return Math.max(0, Math.min(100, s))
}

/* --------------------------------------------------------- 序列化输出 */

export const toListItem = (p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  author: p.author,
  featured_image: p.featured_image ?? null,
  reading_time: p.reading_time ?? null,
  published_at: p.published_at,
  updated_at: p.updated_at,
  tags: p.tags ?? [],
})

export const toDetail = (p) => ({
  ...toListItem(p),
  content: p.content || '',
  seo_title: p.seo_title || p.title,
  seo_description: p.seo_description || p.excerpt,
  primary_keyword: p.primary_keyword || '',
  secondary_keywords: p.secondary_keywords ?? [],
  sources: p.sources ?? [],
  faq: p.faq ?? [],
  internal_links: p.internal_links ?? [],
  word_count: p.word_count ?? countWords(p.content),
  quality_score: p.quality_score ?? null,
})

/* ------------------------------------------------------------- 鉴权 */

export function readToken(request, url, body) {
  const auth = request.headers.get('Authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  const q = url.searchParams.get('token')
  if (q) return q.trim()
  if (body && typeof body.token === 'string') return body.token.trim()
  return ''
}

export function checkAuth(request, url, body, env) {
  const expected = String(env?.BLOG_ADMIN_TOKEN || '').trim()
  if (!expected) return { ok: false, reason: 'server_token_missing' }
  const got = readToken(request, url, body)
  return { ok: got === expected, reason: got ? 'bad_token' : 'no_token' }
}

/* ------------------------------------------------------ 文章规范化 */

export function normalizePost(input = {}, existing = null) {
  const content = String(input.content ?? existing?.content ?? '')
  const title = String(input.title ?? existing?.title ?? 'Untitled').slice(0, 200)
  const now = Date.now()
  const base = {
    id: existing?.id || input.id || uid(),
    slug: slugify(input.slug || existing?.slug || title),
    title,
    excerpt: String(input.excerpt ?? existing?.excerpt ?? stripHtml(content).slice(0, 200)),
    category: input.category ?? existing?.category ?? 'Buying From China',
    author: input.author ?? existing?.author ?? 'BuyTCN Editorial Team',
    featured_image: input.featured_image ?? existing?.featured_image ?? null,
    reading_time: input.reading_time ?? existing?.reading_time ?? readingTime(content),
    word_count: countWords(content),
    published_at: input.published_at ?? existing?.published_at ?? now,
    updated_at: now,
    tags: Array.isArray(input.tags) ? input.tags : existing?.tags ?? [],
    content,
    seo_title: String(input.seo_title ?? existing?.seo_title ?? title).slice(0, 70),
    seo_description: String(input.seo_description ?? existing?.seo_description ?? input.excerpt ?? '').slice(0, 200),
    primary_keyword: input.primary_keyword ?? existing?.primary_keyword ?? '',
    secondary_keywords: Array.isArray(input.secondary_keywords)
      ? input.secondary_keywords
      : existing?.secondary_keywords ?? [],
    sources: Array.isArray(input.sources) ? input.sources : existing?.sources ?? [],
    faq: Array.isArray(input.faq) ? input.faq : existing?.faq ?? [],
    internal_links: Array.isArray(input.internal_links) ? input.internal_links : existing?.internal_links ?? [],
    status: input.status ?? existing?.status ?? 'draft',
  }
  // 质量分：显式传入则尊重，否则按内容自动计算
  base.quality_score =
    input.quality_score ?? existing?.quality_score ?? qualityScore(base)
  return base
}
