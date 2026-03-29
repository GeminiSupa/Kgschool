'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppLanguage, defaultLanguage, translate } from './translations'

type I18nContextValue = {
  lang: AppLanguage
  setLang: (lang: AppLanguage) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'kgschool_lang'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(defaultLanguage)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'de' || saved === 'en' || saved === 'tr') {
      setLangState(saved)
    }
  }, [])

  const setLang = (next: AppLanguage) => {
    setLangState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
    }
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => translate(lang, key),
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

