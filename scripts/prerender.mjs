// Prerender SPA home page for SEO: after `vite build`, render dist/index.html
// in headless Edge so the final HTML contains real body text (crawlers that do
// not execute JS — Bingbot, some others — can read & index the page).
//
// Windows note: we serve dist with `python -m http.server` (a Node http server
// was unreachable from the headless browser in this environment).
//
// Usage: node scripts/prerender.mjs   (run after build, cwd = project root)
import { existsSync } from 'node:fs'
import { writeFile, readFile } from 'node:fs/promises'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'

const run = promisify(execFile)
const root = process.cwd()
const dist = join(root, 'dist')
const port = 4187

function findEdge() {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ]
  for (const c of candidates) {
    try { if (existsSync(c)) return c } catch { /* next */ }
  }
  return null
}

function findPython() {
  const candidates = [
    'C:/Users/Administrator/.workbuddy/binaries/python/versions/3.13.12/python.exe',
    'python',
    'py',
    'python3',
  ]
  for (const c of candidates) {
    try {
      const s = spawn(c, ['--version'], { stdio: 'ignore' })
      s.on('error', () => {})
      s.unref()
      return c // best effort; spawn error is caught by the caller anyway
    } catch { /* next */ }
  }
  return 'python'
}

async function main() {
  const edge = findEdge()
  if (!edge) { console.log('prerender: no Edge/Chrome found, skip'); return }
  const py = findPython()

  // 1. Start python static server
  const srv = spawn(py, ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dist], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  // Wait until the server accepts connections
  await new Promise((resolve) => setTimeout(resolve, 1200))
  console.log('prerender: serving dist on 127.0.0.1:' + port)

  try {
    const url = `http://127.0.0.1:${port}/`
    const { stdout } = await run(edge, [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--disable-features=msEdgeDumpDomPerfetto', // keeps DOM dump stable
      '--virtual-time-budget=15000', '--dump-dom', url,
    ], { timeout: 90000, maxBuffer: 40 * 1024 * 1024 })
    const out = stdout.trim()
    if (out.length < 8000) throw new Error('rendered output suspiciously small (' + out.length + ')')
    if (out.includes('ERR_CONNECTION') || /<title>127\.0\.0\.1<\/title>/.test(out)) {
      throw new Error('browser could not reach local server (got error page)')
    }
    const final = /^<!doctype/i.test(out) || out.startsWith('<html')
      ? out
      : '<!doctype html>\n' + out
    await writeFile(join(dist, 'index.html'), final, 'utf8')
    const text = final.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log(`prerender: OK — index.html ${(final.length / 1024).toFixed(1)} KB, visible text ~${text.length} chars`)
  } catch (e) {
    console.error('prerender FAILED:', e && e.message ? e.message : e)
    process.exitCode = 1
  } finally {
    srv.kill()
  }
}

main()
