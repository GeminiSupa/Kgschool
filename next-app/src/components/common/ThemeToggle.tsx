'use client'

import React, { useEffect, useState } from 'react'

export function ThemeToggle() {
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
      onClick={toggleTheme}
      className="p-3 rounded-2xl glass hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg border-white/20 group relative overflow-hidden"
      aria-label="Toggle Night Mode"
    >
      <div className="relative z-10 text-xl flex items-center justify-center">
        {isDark ? (
          <span className="animate-in zoom-in duration-500">🌙</span>
        ) : (
          <span className="animate-in zoom-in duration-500">☀️</span>
        )}
      </div>
      <div className={`absolute inset-0 opacity-20 transition-colors duration-500 ${isDark ? 'bg-aura-indigo' : 'bg-aura-coral'}`} />
    </button>
  )
}
