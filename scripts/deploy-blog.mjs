# BuyTCN Blog 频道恢复 — 部署脚本
#
# 用法（在 chinasavings-src 项目根目录执行）：
#   node deploy-blog.mjs seed         仅注入文章种子到 KV（不动静态资源）
#   node deploy-blog.mjs build        构建 + 全量部署
#
# 需要环境变量：
#   CLOUDFLARE_API_TOKEN   有 Pages:Edit + Workers KV Storage:Edit 权限的 token
#
# 说明：
#   · 本脚本做两件事：(1) 把种子文章写入 KV；(2) 全量构建并部署 Pages。
#   · ⚠️ Pages 是整包替换式部署 —— 必须全量，不能只传子目录，否则会清空 Functions。
#   · KV 写入走 REST API，不依赖 wrangler kv 子命令（避免版本差异）。

import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = process.cwd()

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '1159b33e5cc667234ac87bd101ffd623'
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
const KV_NAMESPACE_ID = process.env.BLOG_KV_ID || ''
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy || ''

const mode = process.argv[2] || 'help'

function die(msg) {
  console.error('\n✗ ' + msg + '\n')
  process.exit(1)
}

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    die(`Cloudflare API 失败 ${path}\n${JSON.stringify(data.errors || data, null, 2)}`)
  }
  return data
}

async function writeKV(key, value) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(value),
  })
  if (!res.ok) {
    const txt = await res.text()
    die(`写 KV 失败 key=${key}: HTTP ${res.status} ${txt}`)
  }
  console.log(`  ✓ KV[${key}] 已写入 (${JSON.stringify(value).length} bytes)`)
}

async function seed() {
  if (!API_TOKEN) die('缺少 CLOUDFLARE_API_TOKEN')
  if (!KV_NAMESPACE_ID) die('缺少 BLOG_KV_ID（KV 命名空间 id）')

  // 优先用项目内的 data/posts.seed.json（install-blog.mjs 会复制进来），
  // 回退到恢复包里的原始种子。
  const candidates = [
    join(ROOT, 'data', 'posts.seed.json'),
    join(__dirname, '..', 'data', 'posts.seed.json'),
  ]
  let seedPath = null
  for (const c of candidates) {
    try {
      await readFile(c, 'utf8')
      seedPath = c
      break
    } catch {
      /* next */
    }
  }
  if (!seedPath) die('找不到 posts.seed.json（已找过：\n  ' + candidates.join('\n  ') + '）')

  const raw = await readFile(seedPath, 'utf8')
  const parsed = JSON.parse(raw)
  const posts = Array.isArray(parsed) ? parsed : parsed.posts || []
  if (!posts.length) die('种子文件里没有文章')

  console.log(`读取种子：${seedPath}`)
  console.log(`  共 ${posts.length} 篇文章`)
  await writeKV('posts', posts)
  console.log('种子注入完成。')
}

async function buildAndDeploy() {
  const { spawnSync } = await import('node:child_process')
  console.log('→ npm run build')
  const b = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', cwd: ROOT, shell: true })
  if (b.status !== 0) die('构建失败')

  console.log('→ 部署到 Cloudflare Pages (chinasavings)')
  const d = spawnSync(
    'npx',
    ['--yes', 'wrangler@latest', 'pages', 'deploy', 'dist', '--project-name=chinasavings', '--branch=main'],
    { stdio: 'inherit', cwd: ROOT, shell: true },
  )
  if (d.status !== 0) die('部署失败')
  console.log('\n✓ 部署完成')
}

async function createKV() {
  if (!API_TOKEN) die('缺少 CLOUDFLARE_API_TOKEN')

  // 先看是否已存在同名 namespace，避免重复创建
  const list = await cf(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces?per_page=100`)
  const existing = (list.result || []).find((n) => n.title === 'BLOG' || n.title === 'chinasavings-BLOG')
  if (existing) {
    console.log(`  · 已存在 KV 命名空间「${existing.title}」，id = ${existing.id}`)
    printKvHint(existing.id)
    return
  }

  const created = await cf(`/accounts/${ACCOUNT_ID}/storage/kv/namespaces`, {
    method: 'POST',
    body: JSON.stringify({ title: 'BLOG' }),
  })
  const id = created.result?.id
  console.log(`  ✓ 已创建 KV 命名空间「BLOG」，id = ${id}`)
  printKvHint(id)
}

function printKvHint(id) {
  console.log('')
  console.log('把下面这行替换进 wrangler.toml 的 kv_namespaces：')
  console.log(`  { binding = "BLOG", id = "${id}" }`)
  console.log('')
  console.log('然后：')
  console.log(`  BLOG_KV_ID=${id} node scripts/deploy-blog.mjs seed`)
}

async function main() {
  console.log('BuyTCN Blog 恢复部署脚本')
  console.log('  账号:', ACCOUNT_ID)
  console.log('  模式:', mode)
  if (PROXY) console.log('  代理:', PROXY)
  console.log('')

  if (mode === 'kv') return createKV()
  if (mode === 'seed') return seed()
  if (mode === 'build') return buildAndDeploy()

  console.log('用法:')
  console.log('  node deploy-blog.mjs kv      创建 BLOG KV 命名空间（幂等）')
  console.log('  node deploy-blog.mjs seed    仅注入文章种子到 KV')
  console.log('  node deploy-blog.mjs build   构建并全量部署\n')
  console.log('需要环境变量:')
  console.log('  CLOUDFLARE_API_TOKEN   Pages:Edit + Workers KV Storage:Edit')
  console.log('  BLOG_KV_ID             KV 命名空间 id（seed 时需要）')
  console.log('  CLOUDFLARE_ACCOUNT_ID  可选，默认已内置')
}

main().catch((e) => die(e.message))
