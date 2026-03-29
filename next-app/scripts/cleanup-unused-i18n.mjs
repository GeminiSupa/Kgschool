/**
 * Removes injected i18n lines when t(pT is never used.
 * Run: node scripts/cleanup-unused-i18n.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function walk(dir) {
  const out = []
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n)
    if (fs.statSync(p).isDirectory()) out.push(...walk(p))
    else if (n === 'page.tsx') out.push(p)
  }
  return out
}

let n = 0
for (const fp of walk(path.join(root, 'src/app'))) {
  const orig = fs.readFileSync(fp, 'utf8')
  if (!orig.includes('useI18n') || orig.includes('t(pT') || /t\s*\(\s*['"]/.test(orig)) continue

  let s = orig
  s = s.replace(
    /\nimport \{ useI18n \} from '@\/i18n\/I18nProvider'\nimport \{ pT \} from '@\/i18n\/pT'\n\nconst ROUTE = '[^']+'\n\n/gm,
    '\n',
  )
  s = s.replace(/^\s*const \{ t \} = useI18n\(\)\s*\n/m, '')

  if (s !== orig) {
    fs.writeFileSync(fp, s)
    n++
    console.log('cleaned', path.relative(root, fp))
  }
}

console.log('done', n)
