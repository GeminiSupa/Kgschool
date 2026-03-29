'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useApplicationsStore, type Application } from '@/stores/applications'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { Heading } from '@/components/ui/Heading'
import { useI18n } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

type BetreuungHoursType = '25' | '35' | '45' | 'ganztag' | 'halbtag' | ''
type Kita = { id: string; name: string }

export default function ApplyPage() {
  const { t } = useI18n()
  const supabase = useMemo(() => createClient(), [])
  const { createApplication } = useApplicationsStore()

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const [kitas, setKitas] = useState<Kita[]>([])
  const [kitasLoading, setKitasLoading] = useState(true)

  const [form, setForm] = useState({
    kita_id: '',
    child_first_name: '',
    child_last_name: '',
    child_date_of_birth: '',
    preferred_start_date: '',
    betreuung_hours_type: '' as BetreuungHoursType,
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    notes: '',
  })

  useEffect(() => {
    const loadKitas = async () => {
      try {
        setKitasLoading(true)
        const { data, error } = await supabase
          .from('kitas')
          .select('id, name')
          .order('name')
        if (error) throw error
        setKitas((data as Kita[]) || [])
      } catch (e: unknown) {
        console.error('Error loading kitas:', e)
        const message = e instanceof Error ? e.message : 'Failed to load kitas'
        setSubmitError(message)
      } finally {
        setKitasLoading(false)
      }
    }

    loadKitas()
  }, [supabase])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const slug = new URLSearchParams(window.location.search).get('kita')
    if (!slug) return
    // Best-effort preselect by slug: requires `kitas.slug` or `kita_sites.slug` to exist.
    // If not present, this is a no-op and user can select manually.
    const run = async () => {
      try {
        const { data } = await supabase.from('kita_sites').select('kita_id').eq('slug', slug).maybeSingle()
        const kitaId = (data as any)?.kita_id as string | undefined
        if (kitaId) setForm((p) => ({ ...p, kita_id: kitaId }))
      } catch {
        // ignore
      }
    }
    run()
  }, [supabase])

  const resetForm = () => {
    setForm({
      kita_id: '',
      child_first_name: '',
      child_last_name: '',
      child_date_of_birth: '',
      preferred_start_date: '',
      betreuung_hours_type: '' as BetreuungHoursType,
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      notes: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kita_id) {
      setSubmitError(t('apply.kitaRequired'))
      return
    }

    setLoading(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      await createApplication({
        ...form,
        status: 'pending',
      } as Partial<Application>)

      setSubmitSuccess(true)
      resetForm()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('apply.submitFailed')
      setSubmitError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <IOSCard className="p-8">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="mb-6">
            <Heading size="xl">{t('apply.title')}</Heading>
            <p className="text-gray-600 mt-2">{t('apply.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('apply.childSection')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="child_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.firstName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="child_first_name"
                    value={form.child_first_name}
                    onChange={(e) => setForm((p) => ({ ...p, child_first_name: e.target.value }))}
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="child_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.lastName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="child_last_name"
                    value={form.child_last_name}
                    onChange={(e) => setForm((p) => ({ ...p, child_last_name: e.target.value }))}
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="child_date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.dob')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="child_date_of_birth"
                    value={form.child_date_of_birth}
                    onChange={(e) => setForm((p) => ({ ...p, child_date_of_birth: e.target.value }))}
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="preferred_start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.preferredStart')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="preferred_start_date"
                    value={form.preferred_start_date}
                    onChange={(e) => setForm((p) => ({ ...p, preferred_start_date: e.target.value }))}
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('apply.careSection')}</h2>
              <label htmlFor="betreuung_hours_type" className="block text-sm font-medium text-gray-700 mb-2">
                {t('apply.careHours')} <span className="text-red-500">*</span>
              </label>
              <select
                id="betreuung_hours_type"
                value={form.betreuung_hours_type}
                onChange={(e) => setForm((p) => ({ ...p, betreuung_hours_type: e.target.value as BetreuungHoursType }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('apply.selectPlease')}</option>
                <option value="25">25 Stunden/Woche</option>
                <option value="35">35 Stunden/Woche</option>
                <option value="45">45 Stunden/Woche</option>
                <option value="ganztag">Ganztag</option>
                <option value="halbtag">Halbtag</option>
              </select>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('apply.parentSection')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.parentName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="parent_name"
                    value={form.parent_name}
                    onChange={(e) => setForm((p) => ({ ...p, parent_name: e.target.value }))}
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.parentEmail')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="parent_email"
                    value={form.parent_email}
                    onChange={(e) => setForm((p) => ({ ...p, parent_email: e.target.value }))}
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('apply.parentPhone')}
                  </label>
                  <input
                    id="parent_phone"
                    value={form.parent_phone}
                    onChange={(e) => setForm((p) => ({ ...p, parent_phone: e.target.value }))}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('apply.facilitySection')}</h2>
              <label htmlFor="kita_id" className="block text-sm font-medium text-gray-700 mb-2">
                {t('apply.preferredKita')} <span className="text-red-500">*</span>
              </label>
              <select
                id="kita_id"
                value={form.kita_id}
                onChange={(e) => setForm((p) => ({ ...p, kita_id: e.target.value }))}
                required
                disabled={kitasLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">{kitasLoading ? t('apply.loading') : t('apply.selectPlease')}</option>
                {kitas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t('apply.notes')}
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t('apply.notesPlaceholder')}
              />
            </div>

            {submitError && <div className="p-4 bg-red-50 text-red-700 rounded-md">{submitError}</div>}
            {submitSuccess && (
              <div className="p-4 bg-green-50 text-green-700 rounded-md">
                {t('apply.success')}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6">
              <IOSButton type="submit" disabled={loading} variant="primary" size="large" className="w-full sm:w-auto">
                {loading ? t('apply.submitting') : t('apply.submit')}
              </IOSButton>
            </div>
          </form>
        </IOSCard>
      </div>
    </div>
  )
}

