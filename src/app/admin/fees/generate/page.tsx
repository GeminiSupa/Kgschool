'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.fees.generate'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useFeeConfigStore } from '@/stores/feeConfig'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function GenerateFeesPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = createClient()
  const feeConfigStore = useFeeConfigStore()

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<any>(null)
  
  const [form, setForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    feeTypes: [] as string[]
  })

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('de-DE', { month: 'long' })
  }

  const handleTypeToggle = (type: string) => {
    setForm(prev => {
        const feeTypes = prev.feeTypes.includes(type)
            ? prev.feeTypes.filter(t => t !== type)
            : [...prev.feeTypes, type]
        return { ...prev, feeTypes }
    })
    setPreview(null)
  }

  const loadPreview = async () => {
    if (form.feeTypes.length === 0) {
        setError('Bitte wählen Sie mindestens eine Gebührenart aus.')
        return
    }
    setGenerating(true)
    setError('')
    try {
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id, group_id')
        .eq('status', 'active')

      if (childrenError) throw childrenError

      let totalAmount = 0
      for (const child of children || []) {
        if (!child.group_id) continue
        for (const feeType of form.feeTypes) {
          const config = await feeConfigStore.getCurrentConfig(child.group_id, feeType)
          if (config) {
            totalAmount += config.amount || 0
          }
        }
      }

      setPreview({
        childrenCount: children?.length || 0,
        totalAmount
      })
    } catch (e: any) {
      setError(e.message || 'Vorschau konnte nicht geladen werden')
      setPreview(null)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview || form.feeTypes.length === 0) return

    setGenerating(true)
    setError('')
    try {
      // In Next.js we use fetch directly for API routes
      const response = await fetch('/api/admin/fees/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: form.month,
          year: form.year,
          fee_types: form.feeTypes
        })
      })

      const result = await response.json()
      if (result.success) {
        alert(`Gebühren erfolgreich für ${result.count} Kinder generiert!`)
        router.push('/admin/fees')
      } else {
        throw new Error(result.message || 'Fehler beim Generieren der Gebühren')
      }
    } catch (e: any) {
      setError(e.message || 'Fehler beim Generieren der Gebühren')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/fees"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Gebühren
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Erstellen Sie die monatlichen Abrechnungen automatisiert auf Basis der Konfiguration.</p>
      </div>

      <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5">
        <form onSubmit={handleGenerate} className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Monat</label>
              <select
                value={form.month}
                onChange={(e) => { setForm(prev => ({ ...prev, month: parseInt(e.target.value) })); setPreview(null) }}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Jahr</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => { setForm(prev => ({ ...prev, year: parseInt(e.target.value) })); setPreview(null) }}
                required
                min={2020}
                max={2100}
                className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-3 ml-1">Gebührenarten</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['tuition', 'activities', 'other'].map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeToggle(type)}
                        className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                            form.feeTypes.includes(type) 
                            ? 'bg-[#667eea] text-white border-[#667eea] shadow-lg shadow-blue-500/20' 
                            : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                        }`}
                    >
                        {type === 'tuition' ? 'Grundgebühr' : type === 'activities' ? 'Aktivitäten' : 'Sonstiges'}
                    </button>
                ))}
            </div>
            <p className="text-[10px] font-bold text-ui-soft mt-4 leading-relaxed">
                Hinweis: Verpflegungsgebühren werden separat über das Mittagessen-Modul abgerechnet.
            </p>
          </div>

          {preview && (
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-xs font-black text-blue-900/40 uppercase tracking-widest mb-4">Abrechnungsvorschau</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-900/60">Aktive Kinder:</span>
                <span className="text-sm font-black text-blue-900">{preview.childrenCount}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-900/10">
                <span className="text-sm font-bold text-blue-900/60">Voraussichtliches Volumen:</span>
                <span className="text-lg font-black text-blue-600">€{preview.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100">{error}</div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <IOSButton type="button" variant="secondary" onClick={() => router.push('/admin/fees')} className="px-6 py-2.5 font-bold">
              Abbrechen
            </IOSButton>
            <IOSButton
              type="button"
              variant="secondary"
              onClick={loadPreview}
              disabled={generating || form.feeTypes.length === 0}
              className="px-6 py-2.5 font-bold border-[#667eea]/20 text-[#667eea] hover:bg-[#667eea]/5"
            >
              {generating ? <LoadingSpinner size="sm" /> : 'Vorschau laden'}
            </IOSButton>
            <IOSButton
              type="submit"
              disabled={generating || !preview || form.feeTypes.length === 0}
              className="px-8 py-2.5 font-bold"
            >
              {generating ? <LoadingSpinner size="sm" /> : 'Jetzt generieren'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}
