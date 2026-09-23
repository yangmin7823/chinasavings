/**
 * 本地预览服务器：模拟 Cloudflare Pages 运行时
 *   - 静态资源从 dist/ 提供
 *   - /api/** 交给 functions/ 下的 handler（内存 KV）
 *   - 未命中的路径回落到 dist/index.html（SPA）
 *
 * 用法: node dev-server.mjs <chinasavings-src 路径> [port]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = process.argv[2]
const PORT = parseInt(process.argv[3] || '8799', 10)
if (!SRC) {
  console.error('用法: node dev-server.mjs <路径> [port]')
  process.exit(1)
}

const DIST = join(SRC, 'dist')
const FN = join(SRC, 'functions')

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

/* ---------- 内存 KV ---------- */
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

const seedRaw = await readFile(join(SRC, 'data', 'posts.seed.json'), 'utf8')
const seed = JSON.parse(seedRaw)
const seedPosts = Array.isArray(seed) ? seed : seed.posts || []
const env = {
  BLOG: makeKV({ posts: JSON.stringify(seedPosts) }),
  BLOG_ADMIN_TOKEN: 'local-dev-token',
  ASSETS: { fetch: async () => new Response('not found', { status: 404 }) },
}
console.log(`已载入 ${seedPosts.length} 篇种子文章`)

/* ---------- 把 URL 映射到 functions 文件 ---------- */
async function resolveFunction(pathname) {
  // /api/blog/posts/xxx -> functions/api/blog/posts/[slug].js
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  const candidates = []

  // 1) 精确 index.js
  candidates.push({ file: join(FN, ...parts, 'index.js'), params: {} })
  // 2) 末段作为 [slug] 参数
  if (parts.length > 1) {
    const dir = parts.slice(0, -1)
    const last = parts[parts.length - 1]
    candidates.push({ file: join(FN, ...dir, '[slug].js'), params: { slug: last } })
    candidates.push({ file: join(FN, ...dir, '[id].js'), params: { id: last } })
  }
  // 3) 直接 .js
  candidates.push({ file: join(FN, ...parts) + '.js', params: {} })

  for (const c of candidates) {
    try {
      const st = await stat(c.file)
      if (st.isFile()) {
        const mod = await import(pathToFileURL(c.file).href + `?t=${Date.now()}`)
        return { mod, params: c.params, file: c.file }
      }
    } catch {
      /* next */
    }
  }
  return null
}

async function serveStatic(pathname, res) {
  let p = join(DIST, decodeURIComponent(pathname))
  // 目录 → index.html
  try {
    const st = await stat(p)
    if (st.isDirectory()) p = join(p, 'index.html')
  } catch {
    /* 继续当文件试 */
  }
  try {
    const st = await stat(p)
    if (!st.isFile()) throw new Error('not file')
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

  // ---- API 走 functions ----
  if (pathname.startsWith('/api/')) {
    const hit = await resolveFunction(pathname)
    if (!hit) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'function not found: ' + pathname }))
      return
    }
    try {
      const method = req.method.toUpperCase()
      const handlerName =
        `onRequest${method[0]}${method.slice(1).toLowerCase()}` in hit.mod
          ? `onRequest${method[0]}${method.slice(1).toLowerCase()}`
          : 'onRequest'
      const handler = hit.mod[handlerName]
      if (!handler) {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'no handler ' + handlerName }))
        return
      }

      // 组装 Request
      const chunks = []
      for await (const c of req) chunks.push(c)
      const bodyBuf = Buffer.concat(chunks)
      const init = { method, headers: req.headers }
      if (bodyBuf.length && method !== 'GET' && method !== 'HEAD') init.body = bodyBuf

      const request = new Request(url.href, init)
      const ctx = {
        request,
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
      console.error('function error:', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: String(e && e.message) }))
    }
    return
  }

  // ---- 静态 ----
  if (await serveStatic(pathname, res)) return

  // ---- SPA 回落 ----
  try {
    const html = await readFile(join(DIST, 'index.html'))
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`预览服务: http://127.0.0.1:${PORT}`)
  console.log(`  /           落地页`)
  console.log(`  /blog/      博客列表`)
  console.log(`  /api/blog/posts`)
})
