import type { TranslationTree } from './translationTypes'

export function mergeDeep<T extends TranslationTree>(base: T, patch: TranslationTree): T {
  const out: TranslationTree = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    const existing = out[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof existing === 'object' && existing !== null && typeof existing !== 'string') {
      out[k] = mergeDeep(existing as TranslationTree, v as TranslationTree)
    } else {
      out[k] = v as string | TranslationTree
    }
  }
  return out as T
}
