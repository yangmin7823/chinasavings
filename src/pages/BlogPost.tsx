import { useEffect, useState } from 'react'
import { getPost, formatDate, type BlogPost } from '../lib/blog-api'
import BlogNav from '../sections/BlogNav'
import BlogFooter from '../sections/BlogFooter'

/**
 * /blog/<slug> —— 文章详情页
 * 含 Article + FAQPage 结构化数据（与原站 SEO 基线一致）
 */
export default function BlogPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const p = await getPost(slug)
        if (!alive) return
        setPost(p)
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [slug])

  /* ---------------- SEO / 结构化数据注入 ---------------- */
  useEffect(() => {
    if (!post) return
    const SITE = 'https://www.buytcn.com'
    const url = `${SITE}/blog/${post.slug}`

    document.title = post.seo_title || post.title

    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', post.seo_description || post.excerpt)
    setMeta('property', 'og:title', post.seo_title || post.title)
    setMeta('property', 'og:description', post.seo_description || post.excerpt)
    setMeta('property', 'og:type', 'article')
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:site_name', 'BuyTCN')

    // canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url

    // JSON-LD: Article + FAQPage
    const graph: unknown[] = [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.seo_description || post.excerpt,
        datePublished: new Date(post.published_at).toISOString(),
        dateModified: new Date(post.updated_at || post.published_at).toISOString(),
        author: { '@type': 'Organization', name: post.author || 'BuyTCN Editorial Team' },
        publisher: { '@type': 'Organization', name: 'BuyTCN' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
    ]
    if (post.faq && post.faq.length) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: post.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      })
    }

    let ld = document.getElementById('blog-jsonld')
    if (!ld) {
      ld = document.createElement('script')
      ld.id = 'blog-jsonld'
      ;(ld as HTMLScriptElement).type = 'application/ld+json'
      document.head.appendChild(ld)
    }
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })

    return () => {
      document.getElementById('blog-jsonld')?.remove()
    }
  }, [post])

  /* ---------------------- 动态标题（避免 FOUC） ---------------------- */
  useEffect(() => {
    if (!post && !loading) document.title = 'Article not found | BuyTCN'
  }, [post, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <BlogNav />
        <div className="max-w-3xl mx-auto px-4 pt-32 pb-20 animate-pulse">
          <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
          <div className="h-8 w-full bg-gray-100 rounded mb-3" />
          <div className="h-8 w-2/3 bg-gray-100 rounded mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <BlogNav />
        <div className="max-w-lg mx-auto px-4 pt-40 pb-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
          <p className="mt-2 text-gray-600">
            这篇文章可能已被移除或链接有误。
          </p>
          <a
            href="/blog/"
            className="inline-block mt-6 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            ← 返回全部文章
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <BlogNav />

      <article className="pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* breadcrumb */}
          <nav className="text-xs text-gray-400 mb-5">
            <a href="/" className="hover:text-red-600">Home</a>
            <span className="mx-1.5">/</span>
            <a href="/blog/" className="hover:text-red-600">Guide</a>
            <span className="mx-1.5">/</span>
            <span className="text-gray-500">{post.category}</span>
          </nav>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {post.category}
            </span>
            {post.reading_time ? (
              <span className="text-[11px] text-gray-400">{post.reading_time} min read</span>
            ) : null}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-lg text-gray-600 leading-relaxed">{post.excerpt}</p>

          <div className="mt-5 pb-6 border-b border-gray-100 flex items-center gap-3 text-xs text-gray-400">
            <span>{post.author || 'BuyTCN Editorial Team'}</span>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
            {post.word_count ? (
              <>
                <span>·</span>
                <span>{post.word_count} words</span>
              </>
            ) : null}
          </div>

          {/* 正文 —— 样式定义在 index.css 的 .blog-prose（不依赖 typography 插件） */}
          <div
            className="blog-prose max-w-none mt-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* FAQ */}
          {post.faq && post.faq.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {post.faq.map((f, i) => (
                  <details
                    key={i}
                    className="group border border-gray-200 rounded-xl p-4 open:bg-gray-50/60 transition-colors"
                  >
                    <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
                      <span className="font-semibold text-gray-900 text-sm leading-snug">{f.q}</span>
                      <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                        ▾
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* 内链 */}
          {post.internal_links && post.internal_links.length > 0 && (
            <section className="mt-12 pt-8 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                Related guides
              </h2>
              <ul className="space-y-1.5">
                {post.internal_links.map((l) => (
                  <li key={l.slug}>
                    <a
                      href={`/blog/${l.slug}`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      → {l.slug.replace(/-/g, ' ')}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900">
              Need something bought and shipped from China?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Send us a link from Taobao, 1688 or any Chinese marketplace — we purchase it,
              inspect it with photos, consolidate and ship it to you.
            </p>
            <a
              href="/#submit-link"
              className="inline-block mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Submit a product link →
            </a>
          </div>

          <div className="mt-8">
            <a href="/blog/" className="text-sm text-gray-500 hover:text-red-600">
              ← 返回全部文章
            </a>
          </div>
        </div>
      </article>

      <BlogFooter />
    </div>
  )
}
