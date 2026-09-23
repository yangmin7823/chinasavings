import { useEffect, useMemo, useState } from 'react'
import {
  getPosts,
  getCategories,
  formatDate,
  type BlogListItem,
} from '../lib/blog-api'
import BlogNav from '../sections/BlogNav'
import BlogFooter from '../sections/BlogFooter'

/** 旧站固定的 8 个分类（顺序与文案 1:1 还原自 /blog/ 预渲染产物） */
const FIXED_CATEGORIES = [
  'Buying From China',
  'Sourcing',
  'Taobao & 1688',
  'Suppliers & Manufacturers',
  'Shipping & Import',
  'E-commerce',
  'China Market Updates',
]

/** 分类 → URL 片段（与旧站 /blog/category/Taobao%20%261688 形式一致） */
function catHref(name: string) {
  return `/blog/category/${encodeURIComponent(name)}`
}

/**
 * /blog —— 文章列表页
 *
 * 版式 1:1 还原自原站 /blog/ 的预渲染产物：
 *   深色 Hero（红色小标 + 大标题 + 副标题 + 搜索表单）
 *   → 灰色通栏分类药丸（真 <a>，SEO 可抓）
 *   → 3 列文章卡网格
 *   → 4 栏页脚
 */
export default function BlogList({ initialCategory = '' }: { initialCategory?: string }) {
  const [posts, setPosts] = useState<BlogListItem[]>([])
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [activeCat, setActiveCat] = useState<string>(initialCategory)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 路由变化（浏览器前进/后退、或从 /blog/category/x 进来）时同步分类
  useEffect(() => {
    setActiveCat(initialCategory)
  }, [initialCategory])

  useEffect(() => {
    document.title = 'China Sourcing Guide | BuyTCN'
    const setMeta = (sel: string, attr: string, val: string) => {
      const el = document.querySelector(sel)
      if (el) el.setAttribute(attr, val)
    }
    setMeta(
      'meta[name="description"]',
      'content',
      'Guides on buying from Taobao, 1688 and Chinese suppliers: sourcing, quality inspection, consolidation, shipping, customs and working with a China shopping agent.',
    )
    setMeta('link[rel="canonical"]', 'href', 'https://www.buytcn.com/blog/')
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [list, cats] = await Promise.all([getPosts({ limit: 200 }), getCategories()])
        if (!alive) return
        setPosts(list.posts)
        setCategories(cats)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  /**
   * 分类条：优先用后端返回的真实分类计数；
   * 若后端某分类计数为 0 或未返回，仍按旧站固定顺序展示（长度与旧站一致）。
   */
  const catBar = useMemo(() => {
    const map = new Map(categories.map((c) => [c.name, c.count]))
    const names = FIXED_CATEGORIES.slice()
    for (const c of categories) if (!names.includes(c.name)) names.push(c.name)
    return names.map((name) => ({ name, count: map.get(name) ?? 0 }))
  }, [categories])

  const visible = useMemo(() => {
    let list = posts
    if (activeCat) list = list.filter((p) => p.category === activeCat)
    const n = query.trim().toLowerCase()
    if (n) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(n) ||
          (p.excerpt || '').toLowerCase().includes(n) ||
          (p.category || '').toLowerCase().includes(n),
      )
    }
    return list
  }, [posts, activeCat, query])

  /** 分类药丸样式（还原旧站：选中 = 深灰底白字；未选中 = 白底灰边） */
  const pill = (on: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
      on
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
    }`

  return (
    <div className="min-h-screen bg-white">
      <BlogNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 text-center px-4">
        <p className="text-xs font-bold tracking-[0.25em] text-red-300 uppercase mb-3">
          China Sourcing Guide
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Learn How to Buy From China Smarter
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Practical guides, sourcing insights and market updates to help you find products,
          suppliers and better ways to buy from China.
        </p>

        <form
          className="mt-8 max-w-md mx-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            document.getElementById('blog-results')?.scrollIntoView({ behavior: 'smooth' })
          }}
          role="search"
        >
          <input
            id="blog-q"
            type="search"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles… e.g. Taobao"
            className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold text-sm"
          >
            Search
          </button>
        </form>
      </section>

      {/* ── 分类筛选条 ────────────────────────────────────────── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-2 flex-wrap justify-center">
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault()
              setActiveCat('')
              window.history.pushState({}, '', '/blog')
            }}
            className={pill(activeCat === '')}
          >
            All
          </a>
          {catBar.map((c) => (
            <a
              key={c.name}
              href={catHref(c.name)}
              onClick={(e) => {
                e.preventDefault()
                setActiveCat(c.name)
                window.history.pushState({}, '', catHref(c.name))
              }}
              className={pill(activeCat === c.name)}
            >
              {c.name}
            </a>
          ))}
        </div>
      </div>

      {/* ── 文章网格 ─────────────────────────────────────────── */}
      <div id="blog-results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-6 animate-pulse">
                <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
                <div className="h-5 w-full bg-gray-100 rounded mb-2" />
                <div className="h-5 w-3/4 bg-gray-100 rounded mb-4" />
                <div className="h-3 w-full bg-gray-50 rounded mb-1.5" />
                <div className="h-3 w-5/6 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-700 font-medium">文章暂时加载不出来</p>
            <p className="mt-1.5 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => location.reload()}
              className="mt-5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 空态 —— 还原旧站原文案 */}
        {!loading && !error && visible.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📝</p>
            {posts.length === 0 ? (
              <>
                <p className="text-lg">Articles are on the way.</p>
                <p className="text-sm mt-2">
                  We publish practical China sourcing guides as our editorial team produces them.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg">No articles match that search.</p>
                <p className="text-sm mt-2">
                  Try a different keyword — or browse all guides.
                </p>
                <button
                  onClick={() => {
                    setQuery('')
                    setActiveCat('')
                  }}
                  className="mt-5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {visible.length} guide{visible.length > 1 ? 's' : ''}
              {activeCat ? ` in ${activeCat}` : ''}
              {query.trim() ? ` matching “${query.trim()}”` : ''}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {visible.map((p) => (
                <article
                  key={p.id}
                  className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all"
                >
                  {p.featured_image ? (
                    <a href={`/blog/${p.slug}`} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                      <img
                        src={p.featured_image}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ) : null}

                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                      {p.reading_time ? (
                        <span className="text-[11px] text-gray-400">
                          {p.reading_time} min read
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-red-600 transition-colors">
                      <a href={`/blog/${p.slug}`}>{p.title}</a>
                    </h2>

                    <p className="mt-2.5 text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
                      {p.excerpt}
                    </p>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(p.published_at)}</span>
                      <a
                        href={`/blog/${p.slug}`}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Read guide →
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <BlogFooter />
    </div>
  )
}
