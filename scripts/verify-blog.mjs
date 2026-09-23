/**
 * 本地验证：直接调用 Functions handler，注入内存 KV。
 * 不依赖 wrangler dev，可在任何 Node 环境跑。
 *
 * 用法: node verify-blog.mjs <chinasavings-src 绝对路径>
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const SRC = process.argv[2]
if (!SRC) {
  console.error('用法: node verify-blog.mjs <chinasavings-src 路径>')
  process.exit(1)
}

const F = join(SRC, 'functions')
const mod = (p) => import(pathToFileURL(join(F, p)).href)

/* ---------- 模拟 Cloudflare KV ---------- */
function makeKV(seed = {}) {
  const m = new Map(Object.entries(seed))
  return {
    async get(k) {
      return m.has(k) ? m.get(k) : null
    },
    async put(k, v) {
      m.set(k, v)
    },
    async delete(k) {
      m.delete(k)
    },
    _dump: () => Object.fromEntries(m),
  }
}

const results = []
const check = (name, pass, detail = '') => {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
  return pass
}

async function main() {
  // 载入种子
  const seedRaw = await readFile(join(SRC, 'data', 'posts.seed.json'), 'utf8')
  const seed = JSON.parse(seedRaw)
  const posts = Array.isArray(seed) ? seed : seed.posts || []

  console.log(`种子文章数: ${posts.length}`)
  const kv = makeKV({ posts: JSON.stringify(posts) })
  const env = { BLOG: kv, BLOG_ADMIN_TOKEN: 'test-token-xyz' }

  /* ---------- 1. 列表 ---------- */
  const listMod = await mod('api/blog/posts/index.js')
  let res = await listMod.onRequestGet({
    request: new Request('https://x/api/blog/posts?limit=200'),
    env,
    params: {},
  })
  let data = await res.json()
  check('GET /api/blog/posts', res.status === 200 && data.ok && data.posts.length === posts.length,
    `status=${res.status} count=${data.posts?.length}`)
  check('  列表项含 slug/title/excerpt/category', !!(data.posts?.[0]?.slug && data.posts[0].title && data.posts[0].excerpt !== undefined && data.posts[0].category))
  check('  列表项不含 content（减小体积）', data.posts?.[0]?.content === undefined)
  const firstSlug = data.posts?.[0]?.slug

  /* ---------- 2. 详情（走 [slug].js） ---------- */
  const detailMod = await mod('api/blog/posts/[slug].js')
  res = await detailMod.onRequestGet({
    request: new Request(`https://x/api/blog/posts/${firstSlug}`),
    env,
    params: { slug: firstSlug },
  })
  data = await res.json()
  check(`GET /api/blog/posts/${firstSlug}`, res.status === 200 && data.ok && !!data.post?.content,
    `status=${res.status} contentLen=${data.post?.content?.length}`)
  check('  详情含 faq / internal_links / seo 字段',
    Array.isArray(data.post?.faq) && Array.isArray(data.post?.internal_links) && typeof data.post?.seo_title === 'string')

  /* ---------- 3. 404 ---------- */
  res = await detailMod.onRequestGet({
    request: new Request('https://x/api/blog/posts/no-such-slug'),
    env,
    params: { slug: 'no-such-slug' },
  })
  check('GET 不存在的 slug → 404', res.status === 404, `status=${res.status}`)

  /* ---------- 4. 分类 ---------- */
  const catMod = await mod('api/blog/categories.js')
  res = await catMod.onRequestGet({ request: new Request('https://x/api/blog/categories'), env })
  data = await res.json()
  const catSum = (data.categories || []).reduce((a, c) => a + c.count, 0)
  check('GET /api/blog/categories', res.status === 200 && data.ok && catSum === posts.length,
    `分类数=${data.categories?.length} 计数和=${catSum}`)

  /* ---------- 5. 选题池 ---------- */
  const topicMod = await mod('api/blog/topics.js')
  res = await topicMod.onRequestGet({ request: new Request('https://x/api/blog/topics'), env })
  data = await res.json()
  check('GET /api/blog/topics（默认选题池）', res.status === 200 && data.ok && (data.topics || []).length > 0,
    `选题数=${data.topics?.length}`)

  /* ---------- 6. 管理接口鉴权 ---------- */
  const adminMod = await mod('api/blog/admin.js')
  res = await adminMod.onRequest({ request: new Request('https://x/api/blog/admin?all=1'), env })
  check('admin 无 token → 403', res.status === 403, `status=${res.status}`)

  res = await adminMod.onRequest({
    request: new Request('https://x/api/blog/admin?all=1', { headers: { Authorization: 'Bearer test-token-xyz' } }),
    env,
  })
  data = await res.json()
  check('admin 正确 token → 放行', res.status === 200 && data.ok,
    `status=${res.status} posts=${data.posts?.length} topics=${data.topics?.length}`)

  /* ---------- 7. admin 保存 + 发布 全链路 ---------- */
  const post = {
    title: 'Verify Test Article',
    slug: 'verify-test-article',
    content: '<p>Hello from the verification script. ' + 'word '.repeat(300) + '</p>',
    excerpt: 'Verification excerpt',
    category: 'Sourcing',
  }
  res = await adminMod.onRequest({
    request: new Request('https://x/api/blog/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token-xyz' },
      body: JSON.stringify({ action: 'save', token: 'test-token-xyz', post }),
    }),
    env,
  })
  // POST 用 request.json() 读 body，需要 Request 支持
  data = await res.json()
  check('admin POST save', res.status === 200 && data.ok, `status=${res.status} ${JSON.stringify(data).slice(0, 120)}`)
  const newId = data.post?.id

  if (newId) {
    res = await adminMod.onRequest({
      request: new Request('https://x/api/blog/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token-xyz' },
        body: JSON.stringify({ action: 'publish', token: 'test-token-xyz', id: newId }),
      }),
      env,
    })
    data = await res.json()
    check('admin POST publish', res.status === 200 && data.ok, `status=${res.status}`)

    // 发布后应能在公开列表里看到
    res = await listMod.onRequestGet({
      request: new Request('https://x/api/blog/posts?limit=200'),
      env,
      params: {},
    })
    data = await res.json()
    const found = (data.posts || []).some((p) => p.slug === 'verify-test-article')
    check('发布后出现在公开列表', found, `count=${data.posts?.length}`)
  }

  console.log('\n' + results.join('\n'))
  const fails = results.filter((r) => r.startsWith('FAIL')).length
  console.log(`\n总计 ${results.length} 项，失败 ${fails} 项`)
  process.exitCode = fails ? 1 : 0
}

main().catch((e) => {
  console.error('验证脚本异常:', e)
  process.exit(1)
})
