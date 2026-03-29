'use client'

import { useI18n } from '@/i18n/I18nProvider'

const options = [
  { id: 'de', label: 'DE' },
  { id: 'en', label: 'EN' },
  { id: 'tr', label: 'TR' },
] as const

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div className={`inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 ${className}`}>
      <span className="px-2 text-[10px] font-black uppercase tracking-widest text-gray-500">{t('common.language')}</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setLang(o.id)}
          className={[
            'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest transition-colors',
            lang === o.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

