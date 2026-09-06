// Reviews API for BuyTCN (Cloudflare Pages Functions + KV)
// GET  /api/reviews                 -> public list of approved reviews
// POST /api/reviews                 -> submit a new review (pending) {name,country,rating,text,photo?}
// POST /api/reviews/admin           -> {action:'approve'|'delete', id, token}
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const j = (status, obj) => new Response(JSON.stringify(obj), { status, headers: HEADERS })
const okBody = { ok: true }

export async function onRequestGet({ env }) {
  try {
    const list = await env.REVIEWS.list({ prefix: 'review:' })
    const out = []
    for (const key of list.keys) {
      try {
        const rec = JSON.parse(await env.REVIEWS.get(key.name))
        if (rec && rec.status === 'approved') {
          out.push({ id: key.name.replace('review:', ''), name: rec.name, country: rec.country, rating: rec.rating, text: rec.text, photo: rec.photo || null, createdAt: rec.createdAt })
        }
      } catch { /* skip corrupt */ }
    }
    out.sort((a, b) => b.createdAt - a.createdAt)
    return j(200, { ok: true, reviews: out })
  } catch (e) {
    return j(500, { ok: false, error: String(e && e.message || e) })
  }
}

export async function onRequestPost({ request, env }) {
  let body
  try { body = await request.json() } catch { return j(400, { ok: false, error: 'invalid JSON' }) }
  if (!body || typeof body !== 'object') return j(400, { ok: false, error: 'bad body' })

  // ---- admin approve / delete ----
  if (body.action) {
    if (!body.token || body.token !== env.REVIEWS_ADMIN_TOKEN) return j(403, { ok: false, error: 'unauthorized' })
    if (!body.id) return j(400, { ok: false, error: 'id required' })
    const key = 'review:' + body.id
    if (body.action === 'approve') {
      const raw = await env.REVIEWS.get(key)
      if (!raw) return j(404, { ok: false, error: 'not found' })
      const rec = JSON.parse(raw)
      rec.status = 'approved'
      await env.REVIEWS.put(key, JSON.stringify(rec))
      return j(200, okBody)
    }
    if (body.action === 'delete') {
      await env.REVIEWS.delete(key)
      return j(200, okBody)
    }
    return j(400, { ok: false, error: 'unknown action' })
  }

  // ---- submit new review ----
  const name = String(body.name || '').trim().slice(0, 60)
  const country = String(body.country || '').trim().slice(0, 60)
  const text = String(body.text || '').trim().slice(0, 2000)
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)))
  const photo = typeof body.photo === 'string' && body.photo.startsWith('data:image') ? body.photo.slice(0, 400_000) : null
  if (!name || !text) return j(400, { ok: false, error: 'name and review text are required' })

  const id = crypto.randomUUID()
  const rec = { name, country, rating, text, photo, status: 'pending', createdAt: Date.now() }
  await env.REVIEWS.put('review:' + id, JSON.stringify(rec))
  return j(200, { ok: true, id })
}
