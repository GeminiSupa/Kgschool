'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.fees.config.id'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useFeeConfigStore } from '@/stores/feeConfig'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function FeeConfigEditPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { id } = useParams()
  
  const { configs, fetchConfigs, updateConfig } = useFeeConfigStore()
  const { groups, fetchGroups } = useGroupsStore()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    fee_type: 'tuition',
    group_id: '',
    amount: 0,
    effective_from: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchGroups()
    fetchConfigs()
  }, [fetchGroups, fetchConfigs])

  useEffect(() => {
    if (configs.length > 0 && id) {
        const config = configs.find(c => c.id === id)
        if (config) {
            setForm({
                fee_type: config.fee_type,
                group_id: config.group_id || '',
                amount: config.amount,
                effective_from: config.effective_from,
                notes: config.notes || ''
            })
            setLoading(false)
        }
    }
  }, [configs, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
        const data = { ...form, group_id: form.group_id || null }
        await updateConfig(id as string, data as any)
        router.push('/admin/fees/config')
    } catch (e: any) {
        alert(e.message || 'Fehler beim Speichern')
    } finally {
        setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/fees/config"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zur Liste
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Gebührenart</label>
                    <select
                        value={form.fee_type}
                        onChange={(e) => setForm(prev => ({ ...prev, fee_type: e.target.value as any }))}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                    >
                        <option value="tuition">Grundgebühr</option>
                        <option value="lunch">Verpflegung</option>
                        <option value="activities">Aktivitäten</option>
                        <option value="other">Sonstiges</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Gruppe (Optional)</label>
                    <select
                        value={form.group_id}
                        onChange={(e) => setForm(prev => ({ ...prev, group_id: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                    >
                        <option value="">Alle Gruppen (Standard)</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Betrag (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Gültig ab</label>
                    <input
                        type="date"
                        value={form.effective_from}
                        onChange={(e) => setForm(prev => ({ ...prev, effective_from: e.target.value }))}
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Anmerkungen</label>
                <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
                />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <IOSButton type="button" variant="secondary" onClick={() => router.push('/admin/fees/config')} className="px-6 py-2.5 font-bold">
                    Abbrechen
                </IOSButton>
                <IOSButton type="submit" disabled={submitting} className="px-10 py-2.5 font-bold">
                    {submitting ? <LoadingSpinner size="sm" /> : 'Speichern'}
                </IOSButton>
            </div>
        </form>
      </IOSCard>
    </div>
  )
}
