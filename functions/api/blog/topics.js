/**
 * BuyTCN Blog — 选题池（公开读，供 AI 自动发布与前端 admin 用）
 *   GET /api/blog/topics → { ok, topics: [...] }
 */
import { loadTopics, ok } from '../../_lib/blog-store.js'

export async function onRequestGet({ env }) {
  const topics = (await loadTopics(env)).filter((t) => t.status === 'active')
  return ok({ topics })
}
