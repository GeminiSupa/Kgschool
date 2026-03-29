'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.pricing.new'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useGroupsStore } from '@/stores/groups'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type LunchPricingCreatePayload = {
  group_id: string
  price_per_meal: number
  effective_from: string
  effective_to?: string | null
}

function todayISODate() {
  return new Date().toISOString().split('T')[0]
}

export default function AdminLunchPricingNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const groupsStore = useGroupsStore()
  const { getUserKitaId } = useKita()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<LunchPricingCreatePayload>(() => ({
    group_id: '',
    price_per_meal: 0,
    effective_from: todayISODate(),
    effective_to: null,
  }))

  const groups = groupsStore.groups

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const kitaId = await getUserKitaId()
        await groupsStore.fetchGroups(kitaId || undefined)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load groups')
      } finally {
        setLoading(false)
      }
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCancel = () => router.push('/admin/lunch/pricing')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (!form.group_id) throw new Error('Please select a group')
      if (!(form.price_per_meal > 0)) throw new Error('Price per meal must be > 0')
      if (!form.effective_from) throw new Error('Effective from is required')

      const payload: LunchPricingCreatePayload = {
        ...form,
        effective_to: form.effective_to ? form.effective_to : null,
      }

      await supabase.from('lunch_pricing').insert([payload]).select().single()

      // Keep current group price in sync when effective for today.
      const effectiveFrom = new Date(payload.effective_from)
      const today = new Date()
      const effectiveTo = payload.effective_to ? new Date(payload.effective_to) : null

      if (effectiveFrom <= today && (!effectiveTo || effectiveTo >= today)) {
        await supabase
          .from('groups')
          .update({ lunch_price_per_meal: payload.price_per_meal })
          .eq('id', payload.group_id)
      }

      alert('Pricing created successfully!')
      router.push('/admin/lunch/pricing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pricing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Pricing
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {error && <ErrorAlert message={error} />}

        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 mb-2">
                Group <span className="text-red-500">*</span>
              </label>
              <select
                id="group_id"
                value={form.group_id}
                onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.age_range})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price_per_meal" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Meal (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="price_per_meal"
                value={form.price_per_meal}
                onChange={(e) => setForm((p) => ({ ...p, price_per_meal: Number(e.target.value) }))}
                type="number"
                step="0.01"
                min={0}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="effective_from" className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From <span className="text-red-500">*</span>
                </label>
                <input
                  id="effective_from"
                  value={form.effective_from}
                  onChange={(e) => setForm((p) => ({ ...p, effective_from: e.target.value }))}
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="effective_to" className="block text-sm font-medium text-gray-700 mb-2">
                  Effective To (Optional)
                </label>
                <input
                  id="effective_to"
                  value={form.effective_to ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      effective_to: e.target.value ? e.target.value : null,
                    }))
                  }
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing pricing</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <IOSButton type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </IOSButton>
              <IOSButton type="submit" disabled={submitting || !form.group_id}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" /> Saving...
                  </span>
                ) : (
                  'Create'
                )}
              </IOSButton>
            </div>
          </form>
        )}
      </IOSCard>
    </div>
  )
}

