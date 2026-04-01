'use client'

import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/i18n/I18nProvider'

export function ThemeToggle() {
  const { t } = useI18n()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    const initialColorValue = root.classList.contains('dark')
    setIsDark(initialColorValue)
  }, [])

  const toggleTheme = () => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.remove('dark')
      root.classList.add('light')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-3 rounded-2xl glass hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg border-white/20 dark:border-white/10 group relative overflow-hidden"
      aria-label={isDark ? t('shell.useLightTheme') : t('shell.useDarkTheme')}
    >
      <div className="relative z-10 flex items-center justify-center text-foreground">
        {isDark ? (
          <Moon className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
        ) : (
          <Sun className="w-5 h-5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
        )}
      </div>
      <div
        className={`absolute inset-0 opacity-15 transition-colors duration-500 ${isDark ? 'bg-aura-indigo' : 'bg-amber-400'}`}
      />
    </button>
  )
}
