import type { TranslationTree } from './translationTypes'

/** Turns { 'a.b.c': 'x' } into { a: { b: { c: 'x' } } } */
export function nestFlatStrings(flat: Record<string, string>): TranslationTree {
  const root: TranslationTree = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.').filter(Boolean)
    if (parts.length === 0) continue
    let cur = root
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      const next = cur[p]
      if (!next || typeof next === 'string') {
        cur[p] = {}
      }
      cur = cur[p] as TranslationTree
    }
    cur[parts[parts.length - 1]] = value
  }
  return root
}
