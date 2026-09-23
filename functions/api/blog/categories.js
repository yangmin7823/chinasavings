/**
 * BuyTCN Blog — 分类列表（公开）
 *   GET /api/blog/categories → { ok, categories: [{ name, count }] }
 */
import { loadPosts, ok } from '../../_lib/blog-store.js'

export async function onRequestGet({ env }) {
  const posts = (await loadPosts(env)).filter((p) => p.status === 'published')
  const map = new Map()
  for (const p of posts) {
    const c = p.category || 'Uncategorised'
    map.set(c, (map.get(c) || 0) + 1)
  }
  const categories = [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  return ok({ categories })
}
