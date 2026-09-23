/**
 * BuyTCN Blog — 管理接口（需鉴权）
 *
 *   GET  /api/blog/admin?all=1      → { ok, posts: [...], topics: [...] }
 *   POST /api/blog/admin            body: { action, token, ... }
 *
 * action 列表：
 *   save        { post }        新建/更新文章（按 id 或 slug 匹配）
 *   publish     { id }          发布
 *   unpublish   { id }          转草稿
 *   delete      { id }          删除文章
 *   seed        { posts:[] }    批量注入种子（按 slug 幂等覆盖）
 *   saveTopic   { topic }       新建/更新选题
 *   deleteTopic { id }          删除选题
 *
 * 鉴权：Authorization: Bearer <BLOG_ADMIN_TOKEN> / ?token= / body.token
 *      —— 与 scripts/trigger.py 的调用方式完全兼容。
 */
import {
  loadPosts,
  savePosts,
  loadTopics,
  saveTopics,
  normalizePost,
  checkAuth,
  handleOptions,
  ok,
  fail,
  uid,
} from '../../_lib/blog-store.js'

export async function onRequest(context) {
  const { request, env } = context
  const pre = handleOptions(request)
  if (pre) return pre

  const url = new URL(request.url)

  let body = null
  if (request.method === 'POST') {
    try {
      body = await request.json()
    } catch {
      return fail('invalid json')
    }
  }

  const auth = checkAuth(request, url, body, env)
  if (!auth.ok) return fail('unauthorized', 403)

  /* ------------------------------- GET ?all=1 ------------------------------- */
  if (request.method === 'GET' && url.searchParams.get('all') === '1') {
    const posts = await loadPosts(env)
    const topics = await loadTopics(env)
    return ok({
      posts: posts.slice().sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0)),
      topics,
    })
  }

  if (request.method !== 'POST') return fail('method not allowed', 405)

  const action = String(body?.action || '')
  let posts = await loadPosts(env)

  /* --------------------------------- save --------------------------------- */
  if (action === 'save') {
    const input = body.post || {}
    const idx = posts.findIndex(
      (p) => (input.id && p.id === input.id) || (input.slug && p.slug === input.slug),
    )
    const merged = normalizePost(input, idx >= 0 ? posts[idx] : null)
    if (idx >= 0) posts[idx] = merged
    else posts.push(merged)
    await savePosts(env, posts)

    // 同步选题池的 article_count
    const topics = await loadTopics(env)
    const t = topics.find((x) => x.category === merged.category)
    if (t) {
      t.article_count = posts.filter((p) => p.category === merged.category && p.status === 'published').length
      await saveTopics(env, topics)
    }
    return ok({ post: merged })
  }

  /* --------------------------------- seed --------------------------------- */
  if (action === 'seed') {
    const incoming = Array.isArray(body.posts) ? body.posts : []
    let added = 0
    for (const p of incoming) {
      const idx = posts.findIndex((x) => x.slug === String(p.slug || '').toLowerCase())
      const merged = normalizePost({ status: 'published', ...p }, idx >= 0 ? posts[idx] : null)
      if (idx >= 0) posts[idx] = merged
      else {
        posts.push(merged)
        added++
      }
    }
    await savePosts(env, posts)
    return ok({ total: posts.length, added })
  }

  /* -------------------------- publish / unpublish -------------------------- */
  if (action === 'publish' || action === 'unpublish') {
    const p = posts.find((x) => x.id === body.id)
    if (!p) return fail('not found', 404)
    p.status = action === 'publish' ? 'published' : 'draft'
    p.updated_at = Date.now()
    await savePosts(env, posts)
    return ok({ post: p })
  }

  /* --------------------------------- delete -------------------------------- */
  if (action === 'delete') {
    const before = posts.length
    posts = posts.filter((x) => x.id !== body.id)
    if (posts.length === before) return fail('not found', 404)
    await savePosts(env, posts)
    return ok({ deleted: body.id })
  }

  /* -------------------------------- topics --------------------------------- */
  if (action === 'saveTopic' || action === 'deleteTopic') {
    const topics = await loadTopics(env)

    if (action === 'deleteTopic') {
      const next = topics.filter((t) => t.id !== body.id)
      await saveTopics(env, next)
      return ok({ deleted: body.id })
    }

    const input = body.topic || {}
    const idx = topics.findIndex(
      (t) => (input.id && t.id === input.id) || (input.keyword && t.keyword === input.keyword),
    )
    const merged = {
      id: idx >= 0 ? topics[idx].id : uid(),
      topic: input.topic ?? '',
      keyword: input.keyword ?? '',
      category: input.category ?? 'Buying From China',
      status: input.status ?? 'active',
      priority: input.priority ?? 0,
      article_count: input.article_count ?? (idx >= 0 ? topics[idx].article_count : 0),
    }
    if (idx >= 0) topics[idx] = merged
    else topics.push(merged)
    await saveTopics(env, topics)
    return ok({ topic: merged })
  }

  return fail('unknown action: ' + action)
}
