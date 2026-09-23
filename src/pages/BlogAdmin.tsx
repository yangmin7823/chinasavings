import { useCallback, useEffect, useState } from 'react'

/**
 * /blog/admin —— 文章后台
 *
 * 功能：
 *   · 文章列表（草稿/已发布），新建、编辑、发布、下架、删除
 *   · 选题池管理（供 AI 自动发布挑选）
 *   · 一键导入种子文章
 *
 * 鉴权：输入 BLOG_ADMIN_TOKEN，存 sessionStorage（key: bat）
 * API：/api/blog/admin（Authorization: Bearer <token>）
 */

const API = '/api/blog/admin'
const TOKEN_KEY = 'bat'

interface AdminPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  reading_time: number | null
  published_at: number
  updated_at: number
  word_count: number
  status: string
  content?: string
  seo_title?: string
  seo_description?: string
  primary_keyword?: string
  secondary_keywords?: string[]
  tags?: string[]
  faq?: { q: string; a: string }[]
  internal_links?: { slug: string }[]
}

interface Topic {
  id: string
  topic: string
  keyword: string
  category: string
  status: string
  priority: number
  article_count: number
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  category: 'Taobao & 1688',
  content: '',
  seo_title: '',
  seo_description: '',
  primary_keyword: '',
  secondary_keywords: '',
  tags: '',
}

const CATEGORIES = [
  'Taobao & 1688',
  'Suppliers & Manufacturers',
  'Buying From China',
  'Shipping & Import',
  'E-commerce',
  'China Market Updates',
  'Sourcing',
]

export default function BlogAdmin() {
  const [token, setToken] = useState('')
  const [pwInput, setPwInput] = useState('')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [tab, setTab] = useState<'posts' | 'topics'>('posts')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<AdminPost | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 4000)
  }

  /* ------------------------------ 数据加载 ------------------------------ */
  const load = useCallback(
    async (tk: string) => {
      try {
        const res = await fetch(`${API}?all=1`, {
          headers: { Authorization: `Bearer ${tk}` },
        })
        const d = await res.json()
        if (!res.ok || !d.ok) {
          if (res.status === 403) {
            sessionStorage.removeItem(TOKEN_KEY)
            setToken('')
            flash('err', '密码不对，或服务端未配置 BLOG_ADMIN_TOKEN')
          } else {
            flash('err', d.error || `加载失败（HTTP ${res.status}）`)
          }
          return false
        }
        setPosts(d.posts || [])
        setTopics(d.topics || [])
        return true
      } catch (e) {
        flash('err', e instanceof Error ? e.message : '网络错误')
        return false
      }
    },
    [],
  )

  useEffect(() => {
    document.title = 'Blog Admin | BuyTCN'
    let ok = document.createElement('meta')
    ok.name = 'robots'
    ok.content = 'noindex,nofollow'
    document.head.appendChild(ok)
    const saved = sessionStorage.getItem(TOKEN_KEY) || ''
    if (saved) {
      setToken(saved)
      load(saved)
    }
    return () => {
      ok.remove()
    }
  }, [load])

  const doLogin = async () => {
    const v = pwInput.trim()
    if (!v) return
    setBusy(true)
    const ok = await load(v)
    setBusy(false)
    if (ok) {
      sessionStorage.setItem(TOKEN_KEY, v)
      setToken(v)
      setPwInput('')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setPosts([])
    setTopics([])
  }

  /* ------------------------------- 写操作 ------------------------------- */
  const apiPost = async (payload: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, token }),
      })
      const d = await res.json()
      if (!res.ok || !d.ok) {
        flash('err', d.error || '操作失败')
        return null
      }
      await load(token)
      return d
    } catch (e) {
      flash('err', e instanceof Error ? e.message : '网络错误')
      return null
    } finally {
      setBusy(false)
    }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
  }

  const openEdit = async (p: AdminPost) => {
    // 列表接口不含 content，按 slug 拉详情（admin 列表里已含 content 时直接可用）
    let full = p
    if (!p.content) {
      setBusy(true)
      try {
        const res = await fetch(`${API}?all=1`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        full = (d.posts || []).find((x: AdminPost) => x.id === p.id) || p
      } catch {
        /* 忽略，用列表数据 */
      } finally {
        setBusy(false)
      }
    }
    setEditing(full)
    setForm({
      title: full.title || '',
      slug: full.slug || '',
      excerpt: full.excerpt || '',
      category: full.category || CATEGORIES[0],
      content: full.content || '',
      seo_title: full.seo_title || '',
      seo_description: full.seo_description || '',
      primary_keyword: full.primary_keyword || '',
      secondary_keywords: (full.secondary_keywords || []).join(', '),
      tags: (full.tags || []).join(', '),
    })
  }

  const save = async (publish: boolean) => {
    if (!form.title.trim()) {
      flash('err', '标题不能为空')
      return
    }
    const post: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      category: form.category,
      content: form.content,
      seo_title: form.seo_title.trim() || undefined,
      seo_description: form.seo_description.trim() || undefined,
      primary_keyword: form.primary_keyword.trim(),
      secondary_keywords: form.secondary_keywords
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: publish ? 'published' : 'draft',
    }
    if (editing) {
      post.id = editing.id
      post.published_at = editing.published_at
      post.faq = editing.faq || []
      post.internal_links = editing.internal_links || []
    }
    const d = await apiPost({ action: 'save', post })
    if (d?.post) {
      flash('ok', publish ? '✅ 已发布' : '📝 已存草稿')
      if (publish && !editing) setEditing(d.post as AdminPost)
      else if (!editing) openNew()
    }
  }

  const seed = async () => {
    if (!confirm('导入 7 篇恢复的种子文章？（按 slug 幂等，不会重复）')) return
    const res = await fetch('/data/posts.seed.json')
    if (!res.ok) {
      flash('err', '找不到 /data/posts.seed.json，请先运行 install-blog.mjs')
      return
    }
    const seedData = await res.json()
    const d = await apiPost({ action: 'seed', posts: seedData.posts || [] })
    if (d) flash('ok', `已导入，共 ${d.total} 篇（新增 ${d.added}）`)
  }

  const del = async (p: AdminPost) => {
    if (!confirm(`确定删除《${p.title}》？此操作不可撤销。`)) return
    const d = await apiPost({ action: 'delete', id: p.id })
    if (d) flash('ok', '已删除')
  }

  const togglePublish = async (p: AdminPost) => {
    const action = p.status === 'published' ? 'unpublish' : 'publish'
    const d = await apiPost({ action, id: p.id })
    if (d) flash('ok', action === 'publish' ? '已发布' : '已转为草稿')
  }

  /* ------------------------------- 渲染 ------------------------------- */

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm text-center shadow-sm">
          <div className="text-3xl">🔐</div>
          <h1 className="mt-3 text-lg font-bold text-gray-900">Blog Admin</h1>
          <p className="mt-1 text-xs text-gray-500">输入 BLOG_ADMIN_TOKEN 进入后台</p>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            placeholder="Admin token"
            className="mt-4 w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          />
          <button
            onClick={doLogin}
            disabled={busy}
            className="mt-3 w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {busy ? '验证中…' : 'Unlock'}
          </button>
          {msg && (
            <p className={`mt-3 text-xs ${msg.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
              {msg.text}
            </p>
          )}
          <a href="/blog/" className="mt-5 inline-block text-xs text-gray-400 hover:text-gray-600">
            ← 返回博客
          </a>
        </div>
      </div>
    )
  }

  const visible = posts.filter((p) => (filter === 'all' ? true : p.status === filter))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/" className="font-bold text-gray-900">
              Buy<span className="text-red-600">TCN</span>
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-700">Blog Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/blog/" className="text-xs text-gray-500 hover:text-red-600">查看前台</a>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {msg && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
              msg.kind === 'ok'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-gray-200">
          {(['posts', 'topics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'posts' ? `文章 (${posts.length})` : `选题池 (${topics.length})`}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左：列表 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {(['all', 'published', 'draft'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-xs rounded-lg ${
                        filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {f === 'all' ? '全部' : f === 'published' ? '已发布' : '草稿'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={seed}
                    disabled={busy}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    title="导入恢复的 7 篇种子文章"
                  >
                    导入种子
                  </button>
                  <button
                    onClick={openNew}
                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                  >
                    + 新建
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {visible.length === 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-500">
                      还没有文章。点「导入种子」把恢复的 7 篇导进来，或「+ 新建」。
                    </p>
                  </div>
                )}
                {visible.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-xl p-3.5 ${
                      editing?.id === p.id ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {p.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                          <span className="text-[10px] text-gray-400">{p.category}</span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-semibold text-gray-900 truncate">
                          {p.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-gray-500 font-mono truncate">/blog/{p.slug}</p>
                        {p.word_count ? (
                          <p className="mt-1 text-[11px] text-gray-400">{p.word_count} words</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => openEdit(p)}
                        className="px-2.5 py-1 text-[11px] border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => togglePublish(p)}
                        className="px-2.5 py-1 text-[11px] border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                      >
                        {p.status === 'published' ? '转草稿' : '发布'}
                      </button>
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                      >
                        预览
                      </a>
                      <button
                        onClick={() => del(p)}
                        className="px-2.5 py-1 text-[11px] border border-red-100 rounded-md text-red-600 hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 右：编辑器 */}
            <section>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
                <h2 className="text-sm font-bold text-gray-900 mb-3">
                  {editing ? `编辑：${editing.title}` : '新建文章'}
                </h2>

                <div className="space-y-3">
                  <Field label="标题 *">
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                      placeholder="文章标题"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Slug（留空自动生成）">
                      <input
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        placeholder="my-post-slug"
                      />
                    </Field>
                    <Field label="分类">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="摘要（列表页展示）">
                    <textarea
                      value={form.excerpt}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-red-500/25"
                      placeholder="一两句话说明这篇文章讲什么"
                    />
                  </Field>

                  <Field label="正文（HTML）">
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      rows={12}
                      className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-red-500/25"
                      placeholder="<h2>标题</h2><p>段落…</p>"
                    />
                  </Field>

                  <details className="border border-gray-100 rounded-lg">
                    <summary className="px-3 py-2 text-xs font-semibold text-gray-600 cursor-pointer">
                      SEO 字段（可选）
                    </summary>
                    <div className="px-3 pb-3 space-y-3">
                      <Field label="SEO 标题">
                        <input
                          value={form.seo_title}
                          onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        />
                      </Field>
                      <Field label="Meta 描述">
                        <textarea
                          value={form.seo_description}
                          onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        />
                      </Field>
                      <Field label="主关键词">
                        <input
                          value={form.primary_keyword}
                          onChange={(e) => setForm({ ...form, primary_keyword: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        />
                      </Field>
                      <Field label="次要关键词（逗号分隔）">
                        <input
                          value={form.secondary_keywords}
                          onChange={(e) => setForm({ ...form, secondary_keywords: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        />
                      </Field>
                      <Field label="标签（逗号分隔）">
                        <input
                          value={form.tags}
                          onChange={(e) => setForm({ ...form, tags: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        />
                      </Field>
                    </div>
                  </details>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => save(false)}
                    disabled={busy}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    存草稿
                  </button>
                  <button
                    onClick={() => save(true)}
                    disabled={busy}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {busy ? '保存中…' : '发布'}
                  </button>
                  {editing && (
                    <button
                      onClick={openNew}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800"
                    >
                      取消编辑
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'topics' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">选题池</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                AI 自动发布脚本（scripts/trigger.py）从这里挑选题 —— 优先 article_count 最少、priority 最高的。
              </p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">选题</th>
                  <th className="text-left px-4 py-2 font-medium">关键词</th>
                  <th className="text-left px-4 py-2 font-medium">分类</th>
                  <th className="text-right px-4 py-2 font-medium">优先级</th>
                  <th className="text-right px-4 py-2 font-medium">已产出</th>
                  <th className="text-left px-4 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 text-gray-900">{t.topic}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{t.keyword}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{t.category}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{t.priority}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{t.article_count}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          t.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
