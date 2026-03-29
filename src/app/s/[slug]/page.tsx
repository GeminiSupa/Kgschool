'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type SiteConfig = {
  brand?: {
    name?: string
    tagline?: string
    logoUrl?: string
  }
  hero?: {
    title?: string
    subtitle?: string
    ctaLabel?: string
    ctaHref?: string
  }
  sections?: Array<{ id: string; title: string; body: string }>
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
}

export default function PublicKitaSitePage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<SiteConfig | null>(null)

  const fallback = useMemo<SiteConfig>(
    () => ({
      brand: { name: 'Kita', tagline: 'Moderne Betreuung. Klare Kommunikation.' },
      hero: {
        title: 'Willkommen in unserer Kita',
        subtitle: 'Informationen, Konzept und Platzanfrage – alles an einem Ort.',
        ctaLabel: 'Platz anfragen',
        ctaHref: '/apply',
      },
      sections: [
        { id: 'konzept', title: 'Pädagogisches Konzept', body: 'Hier können Sie Ihr pädagogisches Profil kurz vorstellen.' },
        { id: 'ablauf', title: 'Tagesablauf', body: 'Beschreiben Sie kurz Bring-/Abholzeiten, Aktivitäten und Rituale.' },
      ],
      contact: {},
    }),
    [],
  )

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await fetch(`/api/public/site/${encodeURIComponent(slug)}`)
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || 'Not found')
        setConfig((json.site?.config as SiteConfig) || fallback)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Not found'
        setError(message)
        setConfig(fallback)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [slug, fallback])

  const brandName = config?.brand?.name || fallback.brand?.name || 'Kita'

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight">{brandName}</p>
            <p className="truncate text-xs text-gray-500">{config?.brand?.tagline || fallback.brand?.tagline}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/apply" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
              Platz anfragen
            </Link>
            <Link href="/login" className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
              Login
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-white">
        <div className="mx-auto max-w-6xl px-6 py-18 md:py-24">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-black uppercase tracking-widest">
            {loading ? 'Lädt…' : error ? 'Vorschau' : 'Offizielle Seite'}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{config?.hero?.title || fallback.hero?.title}</h1>
          <p className="mt-6 max-w-3xl text-base text-white/90 md:text-lg">{config?.hero?.subtitle || fallback.hero?.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={config?.hero?.ctaHref || fallback.hero?.ctaHref || '/apply'}
              className="rounded-xl bg-white px-6 py-3 font-black text-indigo-700 shadow hover:bg-indigo-50"
            >
              {config?.hero?.ctaLabel || fallback.hero?.ctaLabel}
            </Link>
            <Link href="/" className="rounded-xl border border-white/60 px-6 py-3 font-black text-white hover:bg-white/10">
              KG School Plattform
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {(config?.sections || fallback.sections || []).map((s) => (
            <article key={s.id} className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-black tracking-tight">{s.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <h2 className="text-lg font-black tracking-tight">Kontakt</h2>
            <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">E-Mail</p>
                <p className="mt-1 font-semibold">{config?.contact?.email || '—'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Telefon</p>
                <p className="mt-1 font-semibold">{config?.contact?.phone || '—'}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adresse</p>
                <p className="mt-1 font-semibold">{config?.contact?.address || '—'}</p>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-500">
              Hinweis: Inhalte werden durch die Einrichtung gepflegt. Datenschutz/Impressum finden Sie in der Plattform.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-gray-600">
          <p>{brandName}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-900">
              Datenschutz
            </Link>
            <Link href="/imprint" className="hover:text-gray-900">
              Impressum
            </Link>
            <Link href="/security" className="hover:text-gray-900">
              Sicherheit
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

