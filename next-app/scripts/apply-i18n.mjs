/**
 * Injects useI18n + replaces first xl Heading (static text) with {t(pT(ROUTE))}.
 * Run: node scripts/apply-i18n.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { T } from './routeTitlesData.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function fileToRoute(filePath) {
  const rel = path.relative(path.join(root, 'src/app'), filePath).replace(/\\/g, '/')
  if (!rel.endsWith('/page.tsx')) return null
  const dir = rel.slice(0, -'/page.tsx'.length)
  return dir.split('/').map((s) => (s === '[id]' ? 'id' : s === '[slug]' ? 'slug' : s)).join('.')
}

function routeToFile(route) {
  const parts = route.split('.')
  const segs = parts.map((p) => (p === 'id' ? '[id]' : p === 'slug' ? '[slug]' : p))
  return path.join(root, 'src/app', ...segs, 'page.tsx')
}

function injectHeader(content, route) {
  if (content.includes('useI18n')) return content
  if (!content.startsWith("'use client'")) return content
  return content.replace(
    /^'use client'\n\n/,
    `'use client'\n\nimport { useI18n } from '@/i18n/I18nProvider'\nimport { pT } from '@/i18n/pT'\n\nconst ROUTE = '${route}'\n\n`,
  )
}

function injectTInComponent(content) {
  if (content.includes('const { t } = useI18n()')) return content
  const m = content.match(/export default (async )?function\s+\w+\s*\([^)]*\)\s*\{/)
  if (!m) return content
  return content.replace(m[0], `${m[0]}\n  const { t } = useI18n()\n`)
}

function replaceMainHeading(content, titles) {
  const candidates = [titles.de, titles.en, titles.tr].filter(Boolean)
  const re = /(<Heading\s+size="xl"[^>]*>)([\s\S]*?)(<\/Heading>)/
  const match = content.match(re)
  if (!match) return content
  const inner = match[2].trim()
  if (inner.includes('{')) return content
  const ok = candidates.some((c) => c.trim() === inner)
  if (!ok) return content
  return content.replace(re, '$1{t(pT(ROUTE))}$3')
}

function shouldSkip(content) {
  if (content.includes('redirect(') && content.length < 500) return true
  return false
}

function processFile(filePath) {
  const route = fileToRoute(filePath)
  if (!route || !T[route]) return false
  const titles = T[route]
  let s = fs.readFileSync(filePath, 'utf8')
  if (shouldSkip(s)) return false

  const before = s
  s = injectHeader(s, route)
  s = injectTInComponent(s)
  s = replaceMainHeading(s, titles)
  if (s !== before) {
    fs.writeFileSync(filePath, s)
    return true
  }
  return false
}

let n = 0
for (const route of Object.keys(T)) {
  const fp = routeToFile(route)
  if (!fs.existsSync(fp)) continue
  if (processFile(fp)) {
    n++
    console.log('patched', path.relative(root, fp))
  }
}

console.log('done, patched', n, 'files')
