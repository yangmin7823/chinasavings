// Prerender multi-language SPA for SEO.
// After `vite build`, serves dist and dumps the rendered DOM in headless Edge
// for every language URL:
//   /            -> dist/index.html         (en, canonical root)
//   /zh/ /es/ /fr/ /ar/ -> dist/<code>/index.html
// Each output gets a per-language <html lang>, full hreflang set, canonical and
// og:locale injected, and any relative ./asset URLs rewritten to absolute /...
// (so the sub-path pages load styles/scripts/images from the site root).
//
// Usage: node scripts/prerender.mjs  (after build, cwd = project root)
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'

const run = promisify(execFile)
const root = process.cwd()
const dist = join(root, 'dist')
const port = 4187
const SITE = 'https://www.buytcn.com'
const LANGS = ['en', 'zh', 'es', 'fr', 'ar']

// Blog 预渲染目标：列表页 + 所有已发布文章
// slug 列表在构建时从 data/posts.seed.json 读取；读不到则用内置兜底。
const BLOG_SLUGS_FALLBACK = [
  'how-to-buy-from-taobao-in-the-usa',
  '1688-vs-alibaba-which-is-better-for-sourcing',
  'private-label-manufacturing-china-getting-started',
  'china-factory-sourcing-guide-small-importers',
  'taobao-vs-1688-international-buyers',
  'what-is-a-1688-agent-and-when-to-use-one',
  'how-to-find-reliable-chinese-suppliers',
]

async function loadBlogSlugs() {
  try {
    const raw = await readFile(join(root, 'data', 'posts.seed.json'), 'utf8')
    const parsed = JSON.parse(raw)
    const posts = Array.isArray(parsed) ? parsed : parsed.posts || []
    const slugs = posts
      .filter((p) => p && p.slug && (p.status ? p.status === 'published' : true))
      .map((p) => p.slug)
    return slugs.length ? slugs : BLOG_SLUGS_FALLBACK
  } catch {
    return BLOG_SLUGS_FALLBACK
  }
}

/** blog 页面的 head 处理：去掉落地页的 canonical/hreflang，改为文章自身 URL */
function postProcessBlog(html, pagePath, title, description) {
  html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*>\s*<\/script>/g, '')
  html = html.replace(/(src|href)="\.\//g, '$1="/')
  const canonical = SITE + pagePath
  if (/<link rel="canonical" href="[^"]*" ?\/?>/.test(html)) {
    html = html.replace(/<link rel="canonical" href="[^"]*" ?\/?>/, `<link rel="canonical" href="${canonical}" />`)
  } else {
    html = html.replace('</head>', `    <link rel="canonical" href="${canonical}" />\n  </head>`)
  }
  // 清掉落地页残留的 hreflang（blog 暂不做多语言）
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" ?\/?>/g, '')
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" ?\/?>/g, '')
  if (title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
  }
  if (description) {
    if (/<meta name="description" content="[^"]*"/.test(html)) {
      html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`)
    }
    if (/<meta property="og:description" content="[^"]*"/.test(html)) {
      html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
    }
  }
  if (/<meta property="og:url" content="[^"]*"/.test(html)) {
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`)
  }
  return html
}

/** 静态内容页的 head 处理：清掉落地页残留的 canonical/hreflang/JSON-LD，写回本页自己的 */
function postProcessStatic(html, pagePath, title, description) {
  html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*>\s*<\/script>/g, '')
  html = html.replace(/(src|href)="\.\//g, '$1="/')
  // 落地页自带的 hreflang / og:locale 不适用于这些页面
  html = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" ?\/?>/g, '')
  html = html.replace(/<meta property="og:locale" content="[^"]*" ?\/?>/g, '')
  // 只保留 React 注入的 JSON-LD（带 data-site-page 标记），删掉落地页自带的那个
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
  const canonical = SITE + pagePath
  if (/<link rel="canonical" href="[^"]*" ?\/?>/.test(html)) {
    html = html.replace(/<link rel="canonical" href="[^"]*" ?\/?>/, '<link rel="canonical" href="' + canonical + '" />')
  } else {
    html = html.replace('</head>', '    <link rel="canonical" href="' + canonical + '" />\n  </head>')
  }
  if (title) {
    if (/<title>[\s\S]*?<\/title>/.test(html)) html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title + '</title>')
    else html = html.replace('</head>', '    <title>' + title + '</title>\n  </head>')
  }
  if (description) {
    if (/<meta name="description" content="[^"]*"/.test(html)) {
      html = html.replace(/<meta name="description" content="[^"]*"/, '<meta name="description" content="' + description + '"')
    }
    if (/<meta property="og:description" content="[^"]*"/.test(html)) {
      html = html.replace(/<meta property="og:description" content="[^"]*"/, '<meta property="og:description" content="' + description + '"')
    }
    if (/<meta property="og:title" content="[^"]*"/.test(html)) {
      html = html.replace(/<meta property="og:title" content="[^"]*"/, '<meta property="og:title" content="' + title + '"')
    }
  }
  if (/<meta property="og:url" content="[^"]*"/.test(html)) {
    html = html.replace(/<meta property="og:url" content="[^"]*"/, '<meta property="og:url" content="' + canonical + '"')
  }
  return html
}

function findEdge() {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  for (const c of candidates) {
    try { if (existsSync(c)) return c } catch { /* next */ }
  }
  return null
}

const hreflangBlock = LANGS.map((l) => {
  const href = l === 'en' ? SITE + '/' : `${SITE}/${l}/`
  return `<link rel="alternate" hreflang="${l}" href="${href}" />`
}).join('\n    ') + '\n    <link rel="alternate" hreflang="x-default" href="' + SITE + '/" />'

const ogLocale = { en: 'en_US', zh: 'zh_CN', es: 'es_ES', fr: 'fr_FR', ar: 'ar_SA' }

function canonicalFor(l) {
  return l === 'en' ? SITE + '/' : `${SITE}/${l}/`
}

function postProcess(html, lang) {
  // Remove any external gtm.js script that headless Edge itself injected while
  // executing the inline GTM loader during dump. Keeping it would double-load
  // GTM in real browsers (static tag + loader-injected tag). The inline loader
  // stays and injects GTM exactly once at runtime.
  html = html.replace(/<script[^>]*src="[^"]*googletagmanager\.com[^"]*"[^>]*>\s*<\/script>/g, '')
  html = html.replace(/<html([^>]*)\blang="[^"]*"/, `<html$1lang="${lang}"`)
  html = html.replace(/(src|href)="\.\//g, '$1="/')
  html = html.replace(/<link rel="canonical" href="[^"]*" ?\/?>/, `<link rel="canonical" href="${canonicalFor(lang)}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*" ?\/?>\s*/, '')
  html = html.replace(/<meta property="og:site_name"/, `<meta property="og:url" content="${canonicalFor(lang)}" />\n    <meta property="og:locale" content="${ogLocale[lang]}" />\n    <meta property="og:site_name"`)
  html = html.replace('</head>', `    ${hreflangBlock}\n  </head>`)
  return html
}

async function main() {
  const edge = findEdge()
  if (!edge) { console.log('prerender: no Edge/Chrome found, skip'); return }

  const placeholder = join(dist, 'index.html')
  for (const l of LANGS) {
    if (l === 'en') continue
    const dir = join(dist, l)
    mkdirSync(dir, { recursive: true })
    if (!existsSync(join(dir, 'index.html'))) copyFileSync(placeholder, join(dir, 'index.html'))
  }

  // 用自带 Node 服务提供 dist + functions（python -m http.server 不处理 /api/**，
  // 会导致 blog 页面在 dump 时拿不到数据而渲染成错误页）。
  const srv = spawn(process.execPath, [join(root, 'scripts', 'serve-dist.mjs'), String(port)], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  await new Promise((r) => setTimeout(r, 1500))
  console.log('prerender: serving dist on 127.0.0.1:' + port)

  try {
    for (const l of LANGS) {
      const path = l === 'en' ? '/' : `/${l}/`
      const url = `http://127.0.0.1:${port}${path}`
      let out
      try {
        const r = await run(edge, [
          '--headless', '--disable-gpu', '--no-sandbox',
          '--virtual-time-budget=15000', '--dump-dom', url,
        ], { timeout: 90000, maxBuffer: 40 * 1024 * 1024 })
        out = r.stdout.trim()
      } catch (e) {
        console.error(`prerender: FAILED dump for ${path}`, e.message); process.exitCode = 1; continue
      }
      if (out.length < 8000 || out.includes('ERR_CONNECTION') || /<title>127\.0\.0\.1/.test(out)) {
        console.error(`prerender: suspicious output for ${path} (${out.length}), skipping`)
        process.exitCode = 1; continue
      }
      const final = postProcess(out.startsWith('<!doctype') || out.startsWith('<html') ? out : '<!doctype html>\n' + out, l)
      const file = l === 'en' ? join(dist, 'index.html') : join(dist, l, 'index.html')
      await writeFile(file, final, 'utf8')
      const text = final.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      console.log(`prerender: ${path} -> ${(final.length / 1024).toFixed(1)} KB, visible ~${text.length} chars`)
    }
    console.log('prerender: all languages done')

    /* ---------------- Blog 预渲染 ---------------- */
    const blogSlugs = await loadBlogSlugs()
    const blogTargets = [{ path: '/blog/', dir: join(dist, 'blog'), title: 'China Sourcing Guide | BuyTCN', desc: 'Guides on buying from Taobao, 1688 and Chinese suppliers: sourcing, quality inspection, consolidation, shipping, customs and working with a China shopping agent.' }]
    for (const slug of blogSlugs) {
      blogTargets.push({
        path: '/blog/' + slug,
        dir: join(dist, 'blog', slug),
        title: null,
        desc: null,
      })
    }

    for (const t of blogTargets) {
      const url = 'http://127.0.0.1:' + port + t.path
      let out
      try {
        const r = await run(edge, [
          '--headless', '--disable-gpu', '--no-sandbox',
          '--virtual-time-budget=20000', '--dump-dom', url,
        ], { timeout: 90000, maxBuffer: 40 * 1024 * 1024 })
        out = r.stdout.trim()
      } catch (e) {
        console.error('prerender: FAILED dump for ' + t.path, e.message)
        process.exitCode = 1
        continue
      }
      if (out.length < 8000 || out.includes('ERR_CONNECTION')) {
        console.error('prerender: suspicious output for ' + t.path + ' (' + out.length + '), skipping')
        process.exitCode = 1
        continue
      }
      const final = postProcessBlog(
        out.startsWith('<!doctype') || out.startsWith('<html') ? out : '<!doctype html>\n' + out,
        t.path,
        t.title,
        t.desc,
      )
      mkdirSync(t.dir, { recursive: true })
      await writeFile(join(t.dir, 'index.html'), final, 'utf8')
      const text = final.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      console.log('prerender: ' + t.path + ' -> ' + (final.length / 1024).toFixed(1) + ' KB, visible ~' + text.length + ' chars')
    }
    console.log('prerender: blog done (' + blogTargets.length + ' pages)')

    /* ---------------- 静态内容页预渲染（旧多页站恢复的 5 个页面） ---------------- */
    const STATIC_PAGES = [
      {
        path: '/pricing/',
        dir: join(dist, 'pricing'),
        title: 'Transparent, Tiered Service Fees | BuyTCN',
        desc: "BuyTCN's transparent, tiered service fees: from $20 on small orders, dropping to 5% on the portion above $20,000. International shipping charged at real cost.",
      },
      {
        path: '/payment/',
        dir: join(dist, 'payment'),
        title: 'Flexible Payment Options | BuyTCN',
        desc: 'Payment options for your BuyTCN order: PayPal for small orders, plus Wise, XTransfer, LianLian, WorldFirst, Payoneer or bank transfer for larger orders.',
      },
      {
        path: '/faq/',
        dir: join(dist, 'faq'),
        title: 'Frequently Asked Questions | BuyTCN',
        desc: 'Answers to common questions about buying from Taobao, 1688 and other Chinese marketplaces: service fees, QC photos, shipping times, customs and payment methods.',
      },
      {
        path: '/business/',
        dir: join(dist, 'business'),
        title: 'China Sourcing Agent &amp; Purchasing Service | BuyTCN',
        desc: 'China sourcing and purchasing for wholesalers, e-commerce sellers and private-label brands. Supplier sourcing, price negotiation, QC and international shipping coordination.',
      },
      {
        path: '/about/',
        dir: join(dist, 'about'),
        title: 'About Us | BuyTCN',
        desc: 'BuyTCN is a China shopping agent run by Bshine Ltd in Changsha, Hunan, helping overseas buyers purchase from Taobao, 1688, Weidian, Pinduoduo, Tmall and JD.',
      },
    ]

    for (const t of STATIC_PAGES) {
      const url = 'http://127.0.0.1:' + port + t.path
      let out
      try {
        const r = await run(edge, [
          '--headless', '--disable-gpu', '--no-sandbox',
          '--virtual-time-budget=20000', '--dump-dom', url,
        ], { timeout: 90000, maxBuffer: 40 * 1024 * 1024 })
        out = r.stdout.trim()
      } catch (e) {
        console.error('prerender: FAILED dump for ' + t.path, e.message)
        process.exitCode = 1
        continue
      }
      if (out.length < 8000 || out.includes('ERR_CONNECTION')) {
        console.error('prerender: suspicious output for ' + t.path + ' (' + out.length + '), skipping')
        process.exitCode = 1
        continue
      }
      const final = postProcessStatic(
        out.startsWith('<!doctype') || out.startsWith('<html') ? out : '<!doctype html>\n' + out,
        t.path,
        t.title,
        t.desc,
      )
      mkdirSync(t.dir, { recursive: true })
      await writeFile(join(t.dir, 'index.html'), final, 'utf8')
      const text = final.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      console.log('prerender: ' + t.path + ' -> ' + (final.length / 1024).toFixed(1) + ' KB, visible ~' + text.length + ' chars')
    }
    console.log('prerender: static pages done (' + STATIC_PAGES.length + ' pages)')
  } finally {
    srv.kill()
  }
}

main()
