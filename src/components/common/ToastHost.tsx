'use client'

import { useEffect } from 'react'
import { useToastStore } from '@/stores/toast'

export function ToastHost() {
  const { toasts, remove } = useToastStore()

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => remove(t.id), 4500))
    return () => timers.forEach((id) => clearTimeout(id))
  }, [toasts, remove])

  if (toasts.length === 0) return null

  const styleByType: Record<string, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-gray-200 bg-white text-slate-900 dark:text-slate-50',
  }

  return (
    <div className="fixed right-4 top-4 z-100 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'rounded-2xl border p-4 shadow-lg backdrop-blur-xl',
            styleByType[t.type] || styleByType.info,
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {t.title && <p className="text-xs font-black uppercase tracking-widest opacity-60">{t.title}</p>}
              <p className="mt-1 text-sm font-bold">{t.message}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl px-2 py-1 text-xs font-black opacity-60 hover:opacity-100"
              onClick={() => remove(t.id)}
              aria-label="Toast schließen"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

