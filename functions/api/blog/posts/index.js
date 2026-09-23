/**
 * BuyTCN Blog — 文章列表与详情（公开读接口）
 *
 *   GET /api/blog/posts                 列表
 *        ?limit=50&page=1&category=&tag=&q=
 *   GET /api/blog/posts/<slug>          单篇详情（含正文）
 *
 * 返回结构与历史部署保持一致（勿改字段名）：
 *   列表：{ ok, posts: [...], meta: { total, page, pages, limit } }
 *   详情：{ ok, post: { ...含 content/faq/internal_links } }
 */
import { loadPosts, toListItem, toDetail, ok, fail } from '../../../_lib/blog-store.js'

export async function onRequestGet(context) {
  const { request, env, params } = context
  const url = new URL(request.url)

  const posts = (await loadPosts(env)).filter((p) => p.status === 'published')

  // 详情：/api/blog/posts/<slug>  → params.slug 由文件名 [slug].js 提供
  const slugParam = params?.slug
  if (slugParam) {
    const slug = decodeURIComponent(Array.isArray(slugParam) ? slugParam.join('/') : slugParam)
    const found = posts.find((p) => p.slug === slug)
    if (!found) return fail('not found', 404)
    return ok({ post: toDetail(found) })
  }

  // 列表
  let list = posts.slice().sort((a, b) => (b.published_at || 0) - (a.published_at || 0))

  const category = url.searchParams.get('category')
  const tag = url.searchParams.get('tag')
  const q = url.searchParams.get('q')
  if (category) list = list.filter((p) => p.category === category)
  if (tag) list = list.filter((p) => (p.tags || []).includes(tag))
  if (q) {
    const needle = q.toLowerCase()
    list = list.filter(
      (p) =>
        String(p.title || '').toLowerCase().includes(needle) ||
        String(p.excerpt || '').toLowerCase().includes(needle),
    )
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200)
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1)
  const total = list.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const items = list.slice((page - 1) * limit, page * limit).map(toListItem)

  return ok({ posts: items, meta: { total, page, pages, limit } })
}
