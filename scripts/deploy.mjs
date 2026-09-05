// One-command production deploy for BuyTCN (chinasavings Pages project).
// Reads the Cloudflare API token from a LOCAL git-ignored file (never committed),
// then runs `wrangler pages deploy` with the freshly built (prerendered) dist.
//
// Usage:
//   1. Save your Cloudflare API token to .cloudflare-token (one line) — git-ignored.
//   2. npm run deploy   (runs: build with prerender -> deploy)
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokenFile = join(root, '.cloudflare-token')
const ACCOUNT_ID = '1159b33e5cc667234ac87bd101ffd623'
const PROJECT = 'chinasavings'

async function main() {
  let token = process.env.CLOUDFLARE_API_TOKEN || ''
  if (!token && existsSync(tokenFile)) {
    token = (await readFile(tokenFile, 'utf8')).trim()
  }
  if (!token) {
    console.error('No Cloudflare API token found.')
    console.error('Put your token (Cloudflare Pages Edit permission) in: ' + tokenFile)
    console.error('  e.g.  echo cfut_xxx > ' + tokenFile)
    process.exit(1)
  }

  // Verify token quickly against the account
  const env = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: token,
    CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID,
  }
  try {
    const { stdout } = await run(
      process.execPath,
      [join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'whoami'],
      { env, timeout: 30000 },
    )
    console.log('wrangler auth: OK (' + stdout.trim().split('\n')[0].slice(0, 80) + ')')
  } catch (e) {
    // whoami is just a pre-flight nicety; the deploy below uses the same token.
    console.warn('wrangler whoami failed (non-fatal): ' + (e.message || e).toString().slice(0, 120))
  }

  const dist = join(root, 'dist')
  console.log('Deploying ' + dist + ' -> ' + PROJECT + ' ...')
  const { stdout } = await run(
    process.execPath,
    [join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'pages', 'deploy', dist,
     '--project-name', PROJECT, '--commit-dirty=true'],
    { env, timeout: 180000 },
  )
  const lines = stdout.split('\n')
  const url = lines.find((l) => l.includes('pages.dev')) || ''
  console.log(lines.slice(-6).join('\n'))
  console.log('DONE' + (url ? ' -> ' + url.trim() : ''))
}

main().catch((e) => { console.error(e); process.exit(1) })
