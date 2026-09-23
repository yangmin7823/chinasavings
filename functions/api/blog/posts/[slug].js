/**
 * BuyTCN Blog — 单篇文章详情
 *   GET /api/blog/posts/<slug>   → { ok, post: {...} }
 */
import { loadPosts, toDetail, ok, fail } from '../../../_lib/blog-store.js'

export async function onRequestGet(context) {
  const { env, params } = context
  const raw = params?.slug
  const slug = decodeURIComponent(Array.isArray(raw) ? raw.join('/') : String(raw || ''))
  if (!slug) return fail('missing slug')

  const found = (await loadPosts(env)).find((p) => p.slug === slug && p.status === 'published')
  if (!found) return fail('not found', 404)
  return ok({ post: toDetail(found) })
}
