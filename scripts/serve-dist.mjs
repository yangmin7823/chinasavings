/**
 * Prerender 用的本地服务：模拟 Cloudflare Pages 运行时
 *   - dist/ 静态资源
 *   - functions/ 下的 /api/** handler（内存 KV，种子来自 data/posts.seed.json）
 *   - 未命中 → dist/index.html（SPA 兜底）
 *
 * 为什么需要它：prerender 要用 headless 浏览器 dump DOM，
 * 而 blog 页面在渲染时会 fetch /api/blog/posts。
 * 若只用 python -m http.server，API 会 404，dump 出来就是错误页。
 *
 * 用法: node scripts/serve-dist.mjs [port]   (cwd = 项目根)
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

const PORT = parseInt(process.argv[2] || '4187', 10)
const ROOT = process.cwd()
const DIST = join(ROOT, 'dist')
const FN = join(ROOT, 'functions')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function makeKV(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    async get(k) {
      return map.has(k) ? map.get(k) : null
    },
    async put(k, v) {
      map.set(k, v)
    },
    async delete(k) {
      map.delete(k)
    },
  }
}

// 载入种子（读不到就空数组，blog 会显示空态，不影响落地页）
let seedPosts = []
try {
  const raw = await readFile(join(ROOT, 'data', 'posts.seed.json'), 'utf8')
  const parsed = JSON.parse(raw)
  seedPosts = Array.isArray(parsed) ? parsed : parsed.posts || []
} catch {
  /* ignore */
}

const env = {
  BLOG: makeKV({ posts: JSON.stringify(seedPosts) }),
  BLOG_ADMIN_TOKEN: process.env.BLOG_ADMIN_TOKEN || 'local-dev-token',
  ASSETS: { fetch: async () => new Response('not found', { status: 404 }) },
}
console.log(`serve-dist: ${seedPosts.length} seed posts, listening on ${PORT}`)

async function resolveFunction(pathname) {
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  const candidates = [{ file: join(FN, ...parts, 'index.js'), params: {} }]
  if (parts.length > 1) {
    const dir = parts.slice(0, -1)
    const last = parts[parts.length - 1]
    candidates.push({ file: join(FN, ...dir, '[slug].js'), params: { slug: last } })
    candidates.push({ file: join(FN, ...dir, '[id].js'), params: { id: last } })
  }
  candidates.push({ file: join(FN, ...parts) + '.js', params: {} })

  for (const c of candidates) {
    try {
      const st = await stat(c.file)
      if (st.isFile()) {
        const mod = await import(pathToFileURL(c.file).href)
        return { mod, params: c.params }
      }
    } catch {
      /* next */
    }
  }
  return null
}

async function serveStatic(pathname, res) {
  let p = join(DIST, decodeURIComponent(pathname))
  try {
    const st = await stat(p)
    if (st.isDirectory()) p = join(p, 'index.html')
  } catch {
    /* treat as file */
  }
  try {
    const st = await stat(p)
    if (!st.isFile()) throw new Error('not a file')
    const buf = await readFile(p)
    res.writeHead(200, { 'Content-Type': MIME[extname(p).toLowerCase()] || 'application/octet-stream' })
    res.end(buf)
    return true
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const pathname = url.pathname

  if (pathname.startsWith('/api/')) {
    const hit = await resolveFunction(pathname)
    if (!hit) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'function not found: ' + pathname }))
      return
    }
    try {
      const method = req.method.toUpperCase()
      const cap = method[0] + method.slice(1).toLowerCase()
      const handler = hit.mod[`onRequest${cap}`] || hit.mod.onRequest
      if (!handler) {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'no handler for ' + method }))
        return
      }
      const chunks = []
      for await (const c of req) chunks.push(c)
      const bodyBuf = Buffer.concat(chunks)
      const init = { method, headers: req.headers }
      if (bodyBuf.length && method !== 'GET' && method !== 'HEAD') init.body = bodyBuf

      const ctx = {
        request: new Request(url.href, init),
        env,
        params: hit.params,
        waitUntil: () => {},
        next: async () => new Response('next', { status: 404 }),
      }
      const resp = await handler(ctx)
      const out = Buffer.from(await resp.arrayBuffer())
      const headers = {}
      resp.headers.forEach((v, k) => {
        headers[k] = v
      })
      res.writeHead(resp.status, headers)
      res.end(out)
    } catch (e) {
      console.error('serve-dist function error:', e && e.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: String(e && e.message) }))
    }
    return
  }

  if (await serveStatic(pathname, res)) return

  try {
    const html = await readFile(join(DIST, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})

server.listen(PORT, '127.0.0.1')
