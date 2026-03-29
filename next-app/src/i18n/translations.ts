import type { AppLanguage } from './constants'
import { defaultLanguage } from './constants'
import { coreTranslations } from './core'
import { pagesFlat } from './pagesFlat.generated'
import { pagesFlatExtra } from './pagesFlat.extra'
import { nestFlatStrings } from './nestFlat'
import { mergeDeep } from './mergeDeep'
import type { TranslationTree } from './translationTypes'

export type { AppLanguage } from './constants'
export { defaultLanguage } from './constants'

function walk(tree: TranslationTree | undefined, parts: string[]): string | undefined {
  let cur: string | TranslationTree | undefined = tree
  for (const p of parts) {
    if (!cur || typeof cur === 'string') return undefined
    cur = cur[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export const translations: Record<AppLanguage, TranslationTree> = {
  de: mergeDeep(coreTranslations.de, {
    pages: nestFlatStrings({ ...pagesFlat.de, ...pagesFlatExtra.de }),
  }),
  en: mergeDeep(coreTranslations.en, {
    pages: nestFlatStrings({ ...pagesFlat.en, ...pagesFlatExtra.en }),
  }),
  tr: mergeDeep(coreTranslations.tr, {
    pages: nestFlatStrings({ ...pagesFlat.tr, ...pagesFlatExtra.tr }),
  }),
}

export function translate(lang: AppLanguage, key: string): string {
  const parts = key.split('.').filter(Boolean)
  let v = walk(translations[lang], parts)
  if (v) return v
  if (lang !== 'de') {
    v = walk(translations.de, parts)
    if (v) return v
  }
  return key
}
