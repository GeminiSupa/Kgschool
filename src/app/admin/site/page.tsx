'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.site'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { sT } from '@/i18n/sT'

type SiteConfig = {
  brand?: { name?: string; tagline?: string }
  hero?: { title?: string; subtitle?: string; ctaLabel?: string }
  sections?: Array<{ id: string; title: string; body: string }>
  contact?: { email?: string; phone?: string; address?: string }
}

const defaultConfig: SiteConfig = {
  brand: { name: '', tagline: 'Moderne Betreuung. Klare Kommunikation.' },
  hero: { title: 'Willkommen in unserer Kita', subtitle: 'Informationen, Konzept und Platzanfrage – alles an einem Ort.', ctaLabel: 'Platz anfragen' },
  sections: [
    { id: 'konzept', title: 'Pädagogisches Konzept', body: '' },
    { id: 'ablauf', title: 'Tagesablauf', body: '' },
  ],
  contact: { email: '', phone: '', address: '' },
}

export default function AdminSiteBuilderPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [kitaId, setKitaId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [published, setPublished] = useState(false)
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const id = await getActiveKitaId()
        if (!id) throw new Error(t(sT('errKitaNotFound')))
        setKitaId(id)

        // Pre-fill brand name from kitas table if available.
        const { data: kitaData } = await supabase.from('kitas').select('name').eq('id', id).maybeSingle()
        const name = (kitaData as any)?.name as string | undefined

        const { data, error } = await supabase.from('kita_sites').select('*').eq('kita_id', id).maybeSingle()
        if (error && !String(error.message || '').toLowerCase().includes('permission')) throw error

        if (data) {
          setSlug((data as any).slug || '')
          setPublished(!!(data as any).published)
          setConfig({ ...defaultConfig, ...(data as any).config, brand: { ...defaultConfig.brand, ...(data as any).config?.brand } })
        } else {
          setConfig((p) => ({ ...p, brand: { ...p.brand, name: name || p.brand?.name || '' } }))
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Website konnte nicht geladen werden.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [supabase])

  const handleSave = async () => {
    if (!kitaId) return
    if (!slug.trim()) {
      setError(t(sT('errSlugRequired')))
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const payload = {
        kita_id: kitaId,
        slug: slug.trim(),
        published,
        config,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('kita_sites').upsert(payload as any, { onConflict: 'kita_id' })
      if (error) throw error
      setSuccess(t(sT('successSiteSaved')))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errSaveSite'))
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  const previewHref = slug ? `/s/${encodeURIComponent(slug.trim())}` : '/s/preview'

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Öffentliche Kita-Seite + Platzanfrage-Funnel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={previewHref} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">
            Vorschau öffnen
          </Link>
          <IOSButton onClick={handleSave} disabled={saving} variant="primary" size="medium">
            {saving ? 'Speichert…' : 'Speichern'}
          </IOSButton>
        </div>
      </div>

      {error && <IOSCard className="p-5 border-red-200 bg-red-50/40 mb-4"><p className="text-sm font-bold text-red-700">{error}</p></IOSCard>}
      {success && <IOSCard className="p-5 border-emerald-200 bg-emerald-50/40 mb-4"><p className="text-sm font-bold text-emerald-700">{success}</p></IOSCard>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IOSCard className="p-6 border-black/5">
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Veröffentlichung</p>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-black text-gray-700">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="kita-musterstadt"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#667eea]/50"
            />
            <label className="inline-flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Öffentlich sichtbar
            </label>
            <p className="text-xs text-gray-500">Öffentliche URL: <span className="font-mono">{slug ? `/s/${slug.trim()}` : '—'}</span></p>
          </div>
        </IOSCard>

        <IOSCard className="p-6 border-black/5">
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Brand & Hero</p>
          <div className="mt-4 grid gap-3">
            <input
              value={config.brand?.name || ''}
              onChange={(e) => setConfig((p) => ({ ...p, brand: { ...(p.brand || {}), name: e.target.value } }))}
              placeholder="Kita-Name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
            <input
              value={config.brand?.tagline || ''}
              onChange={(e) => setConfig((p) => ({ ...p, brand: { ...(p.brand || {}), tagline: e.target.value } }))}
              placeholder="Tagline"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
            <input
              value={config.hero?.title || ''}
              onChange={(e) => setConfig((p) => ({ ...p, hero: { ...(p.hero || {}), title: e.target.value } }))}
              placeholder="Hero Titel"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
            <textarea
              value={config.hero?.subtitle || ''}
              onChange={(e) => setConfig((p) => ({ ...p, hero: { ...(p.hero || {}), subtitle: e.target.value } }))}
              placeholder="Hero Untertitel"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
          </div>
        </IOSCard>

        <IOSCard className="p-6 border-black/5 lg:col-span-2">
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Abschnitte</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(config.sections || []).map((s, idx) => (
              <div key={s.id} className="rounded-2xl border border-gray-200 p-4">
                <input
                  value={s.title}
                  onChange={(e) =>
                    setConfig((p) => {
                      const next = [...(p.sections || [])]
                      next[idx] = { ...next[idx], title: e.target.value }
                      return { ...p, sections: next }
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-black"
                />
                <textarea
                  value={s.body}
                  onChange={(e) =>
                    setConfig((p) => {
                      const next = [...(p.sections || [])]
                      next[idx] = { ...next[idx], body: e.target.value }
                      return { ...p, sections: next }
                    })
                  }
                  rows={6}
                  className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold"
                  placeholder="Text…"
                />
              </div>
            ))}
          </div>
        </IOSCard>

        <IOSCard className="p-6 border-black/5 lg:col-span-2">
          <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Kontakt</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={config.contact?.email || ''}
              onChange={(e) => setConfig((p) => ({ ...p, contact: { ...(p.contact || {}), email: e.target.value } }))}
              placeholder="E-Mail"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
            <input
              value={config.contact?.phone || ''}
              onChange={(e) => setConfig((p) => ({ ...p, contact: { ...(p.contact || {}), phone: e.target.value } }))}
              placeholder="Telefon"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
            <input
              value={config.contact?.address || ''}
              onChange={(e) => setConfig((p) => ({ ...p, contact: { ...(p.contact || {}), address: e.target.value } }))}
              placeholder="Adresse"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold"
            />
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Für vollständige Funktion bitte SQL aus <span className="font-mono">next-app/sql/tenant_site_builder.sql</span> in Supabase ausführen.
          </p>
        </IOSCard>
      </div>
    </div>
  )
}

