'use client'

import { useI18n } from '@/i18n/I18nProvider'

const options = [
  { id: 'de', label: 'DE' },
  { id: 'en', label: 'EN' },
  { id: 'tr', label: 'TR' },
] as const

export function LanguageSwitcher({
  className = '',
  compact = false,
}: {
  className?: string
  /** Use smaller buttons; best for mobile top bar. */
  compact?: boolean
}) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={`inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 dark:border-white/15 dark:bg-white/5 ${className}`}
    >
      <span className="hidden sm:inline px-2 text-[10px] font-black uppercase tracking-widest text-ui-muted">
        {t('common.language')}
      </span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setLang(o.id)}
          className={[
            compact
              ? 'min-h-9 min-w-9 touch-manipulation rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors'
              : 'min-h-11 min-w-11 touch-manipulation rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1',
            lang === o.id
              ? 'bg-gray-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10',
          ].join(' ')}
          aria-pressed={lang === o.id}
          aria-label={`${t('common.language')}: ${o.label}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
