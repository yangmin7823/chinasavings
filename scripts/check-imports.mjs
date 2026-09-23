/**
 * 校验 functions/ 下所有 .js 的相对 import 是否真实可解析。
 * 专门盯 _lib 这类跨目录引用 —— 层级写错会在线上运行时才 500。
 *
 * 用法: node check-imports.mjs <chinasavings-src 路径>
 */
import { readdir, readFile, access } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'

const SRC = process.argv[2]
if (!SRC) {
  console.error('用法: node check-imports.mjs <路径>')
  process.exit(1)
}

const FN = join(SRC, 'functions')

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (e.name.endsWith('.js') || e.name.endsWith('.ts')) out.push(p)
  }
  return out
}

const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

const files = await walk(FN)
const bad = []
const good = []

for (const f of files) {
  const src = await readFile(f, 'utf8')
  const re = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g
  let m
  while ((m = re.exec(src))) {
    const spec = m[1]
    const abs = resolve(dirname(f), spec)
    const ok = (await exists(abs)) || (await exists(abs + '.js')) || (await exists(abs + '.ts'))
    const rel = f.replace(FN, 'functions')
    if (ok) good.push(`OK   ${rel}  ->  ${spec}`)
    else bad.push(`BAD  ${rel}  ->  ${spec}   (解析为 ${abs})`)
  }
}

console.log('=== 无法解析的 import ===')
console.log(bad.length ? bad.join('\n') : '(无)')
console.log(`\n=== 统计 ===`)
console.log(`文件数 ${files.length}，引用 ${good.length + bad.length}，异常 ${bad.length}`)
process.exitCode = bad.length ? 1 : 0
