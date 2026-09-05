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
  const py = 'C:/Users/Administrator/.workbuddy/binaries/python/versions/3.13.12/python.exe'

  const placeholder = join(dist, 'index.html')
  for (const l of LANGS) {
    if (l === 'en') continue
    const dir = join(dist, l)
    mkdirSync(dir, { recursive: true })
    if (!existsSync(join(dir, 'index.html'))) copyFileSync(placeholder, join(dir, 'index.html'))
  }

  const srv = spawn(py, ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  await new Promise((r) => setTimeout(r, 1200))
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
  } finally {
    srv.kill()
  }
}

main()
