'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.contracts.new'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useContractsStore, type ChildContract } from '@/stores/contracts'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type ChildLite = {
  id: string
  first_name: string
  last_name: string
  group_id?: string | null
  status: string
}

type ContractForm = {
  child_id: string
  start_date: string
  end_date: string
  contract_number: string
  betreuung_hours_type: ChildContract['betreuung_hours_type']
  fee_category: ChildContract['fee_category']
  lunch_obligation: boolean
  lunch_billing_type: ChildContract['lunch_billing_type']
  lunch_flat_rate_amount: string
  subsidy_type: ChildContract['subsidy_type'] | '' | undefined
  subsidy_amount: string
  notes: string
  status: ChildContract['status']
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function AdminContractsNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const contractsStore = useContractsStore()
  const { getUserKitaId } = useKita()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [availableChildren, setAvailableChildren] = useState<ChildLite[]>([])

  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<ContractForm>(() => ({
    child_id: '',
    start_date: toISODate(new Date()),
    end_date: '',
    contract_number: '',
    betreuung_hours_type: '25',
    fee_category: 'standard',
    lunch_obligation: true,
    lunch_billing_type: 'per_meal',
    lunch_flat_rate_amount: '',
    subsidy_type: '',
    subsidy_amount: '0',
    notes: '',
    status: 'pending',
  }))

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const kitaId = await getUserKitaId()

        let query = supabase
          .from('children')
          .select('id, first_name, last_name, group_id, status')
          .eq('status', 'active')
          .order('first_name')

        if (kitaId) query = query.eq('kita_id', kitaId)

        const { data, error: qErr } = await query
        if (qErr) throw qErr

        setAvailableChildren((data || []) as ChildLite[])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load children')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onLunchBillingTypeChange = (type: ContractForm['lunch_billing_type']) => {
    setForm((prev) => {
      const next = { ...prev, lunch_billing_type: type }
      if (type === 'per_meal') next.lunch_flat_rate_amount = ''
      return next
    })
  }

  const inferKitaIdFromChildGroup = async (child: ChildLite): Promise<string | null> => {
    if (!child.group_id) return null
    const { data, error: qErr } = await supabase
      .from('groups')
      .select('kita_id')
      .eq('id', child.group_id)
      .single()
    if (qErr) return null
    return (data as { kita_id?: string | null })?.kita_id || null
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      if (!form.child_id) {
        setError('Please select a child')
        return
      }
      if (!form.betreuung_hours_type) {
        setError('Please select care hours type')
        return
      }
      if (!form.fee_category) {
        setError('Please select fee category')
        return
      }
      if (!form.start_date) {
        setError('Please select start date')
        return
      }

      if ((form.lunch_billing_type === 'flat_monthly' || form.lunch_billing_type === 'hybrid') && !form.lunch_flat_rate_amount) {
        setError('Please enter a monthly flat rate amount')
        return
      }

      const selectedChild = availableChildren.find((c) => c.id === form.child_id)
      if (!selectedChild) {
        setError('Selected child not found')
        return
      }

      const kitaId = (await getUserKitaId()) || (await inferKitaIdFromChildGroup(selectedChild))

      const subsidyAmountNum = Number(form.subsidy_amount || 0)

      const payload: Partial<ChildContract> = {
        child_id: form.child_id,
        start_date: form.start_date,
        end_date: form.end_date ? form.end_date : undefined,
        contract_number: form.contract_number ? form.contract_number : undefined,
        betreuung_hours_type: form.betreuung_hours_type,
        fee_category: form.fee_category,
        lunch_obligation: form.lunch_obligation,
        lunch_billing_type: form.lunch_billing_type,
        lunch_flat_rate_amount:
          form.lunch_billing_type === 'per_meal' ? undefined : Number(form.lunch_flat_rate_amount || 0),
        subsidy_type: form.subsidy_type ? (form.subsidy_type as ChildContract['subsidy_type']) : undefined,
        subsidy_amount: form.subsidy_type ? subsidyAmountNum : 0,
        notes: form.notes ? form.notes : undefined,
        status: form.status,
        ...(kitaId ? { kita_id: kitaId } : {}),
      }

      const created = await contractsStore.createContract(payload)
      if (created?.id) {
        alert('Contract created successfully!')
      }
      router.push('/admin/contracts')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create contract')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/contracts')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Contracts
        </button>
        <Heading size="xl" className="mb-1">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500">Create a new care contract for a child</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <IOSCard className="max-w-4xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="child_id" className="block text-sm font-semibold text-gray-700 mb-2">
              Child <span className="text-red-500">*</span>
            </label>
            <select
              id="child_id"
              value={form.child_id}
              onChange={(e) => setForm((p) => ({ ...p, child_id: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a child...</option>
              {availableChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="start_date" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-semibold text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                id="end_date"
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">Leave empty for ongoing contract</p>
            </div>
          </div>

          <div>
            <label htmlFor="contract_number" className="block text-sm font-semibold text-gray-700 mb-2">
              Contract Number (Optional)
            </label>
            <input
              id="contract_number"
              value={form.contract_number}
              onChange={(e) => setForm((p) => ({ ...p, contract_number: e.target.value }))}
              type="text"
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., VERT-2024-001"
            />
            <p className="text-xs text-gray-500 mt-2">Auto-generated if left empty</p>
          </div>

          <div>
            <label htmlFor="betreuung_hours_type" className="block text-sm font-semibold text-gray-700 mb-2">
              Betreuungsumfang (Care Hours) <span className="text-red-500">*</span>
            </label>
            <select
              id="betreuung_hours_type"
              value={form.betreuung_hours_type}
              onChange={(e) => setForm((p) => ({ ...p, betreuung_hours_type: e.target.value as ContractForm['betreuung_hours_type'] }))}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="25">25 Stunden/Woche</option>
              <option value="35">35 Stunden/Woche</option>
              <option value="45">45 Stunden/Woche</option>
              <option value="ganztag">Ganztag</option>
              <option value="halbtag">Halbtag</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="fee_category" className="block text-sm font-semibold text-gray-700 mb-2">
                Fee Category <span className="text-red-500">*</span>
              </label>
              <select
                id="fee_category"
                value={form.fee_category}
                onChange={(e) => setForm((p) => ({ ...p, fee_category: e.target.value as ContractForm['fee_category'] }))}
                required
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="reduced">Reduced</option>
                <option value="waived">Waived</option>
                <option value="subsidized">Subsidized</option>
              </select>
            </div>

            <div>
              <label htmlFor="subsidy_type" className="block text-sm font-semibold text-gray-700 mb-2">
                Subsidy Type (Optional)
              </label>
              <select
                id="subsidy_type"
                value={form.subsidy_type || ''}
                onChange={(e) => setForm((p) => ({ ...p, subsidy_type: e.target.value as ContractForm['subsidy_type'] }))}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No subsidy</option>
                <option value="BuT">BuT (Bildungs- und Teilhabepaket)</option>
                <option value="BremenPass">Bremen Pass</option>
                <option value="Geschwisterrabatt">Geschwisterrabatt</option>
                <option value="Landeszuschuss">Landeszuschuss</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {form.subsidy_type && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="subsidy_amount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subsidy Amount (€)
                </label>
                <input
                  id="subsidy_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.subsidy_amount}
                  onChange={(e) => setForm((p) => ({ ...p, subsidy_amount: e.target.value }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100">
            <Heading size="md" className="mb-4">
              Lunch Settings
            </Heading>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl">
                <input
                  id="lunch_obligation"
                  type="checkbox"
                  checked={form.lunch_obligation}
                  onChange={(e) => setForm((p) => ({ ...p, lunch_obligation: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="lunch_obligation" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Lunch Obligation (Child must have lunch)
                </label>
              </div>

              <div>
                <label htmlFor="lunch_billing_type" className="block text-sm font-semibold text-gray-700 mb-2">
                  Lunch Billing Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="lunch_billing_type"
                  value={form.lunch_billing_type}
                  onChange={(e) => {
                    const next = e.target.value as ContractForm['lunch_billing_type']
                    onLunchBillingTypeChange(next)
                  }}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="per_meal">Per Meal</option>
                  <option value="flat_monthly">Flat Monthly Rate</option>
                  <option value="hybrid">Hybrid (Flat + Per Meal)</option>
                </select>
              </div>

              {(form.lunch_billing_type === 'flat_monthly' || form.lunch_billing_type === 'hybrid') && (
                <div>
                  <label htmlFor="lunch_flat_rate_amount" className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Flat Rate (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lunch_flat_rate_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.lunch_flat_rate_amount}
                    onChange={(e) => setForm((p) => ({ ...p, lunch_flat_rate_amount: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="66.00"
                  />
                  <p className="text-xs text-gray-500 mt-2">Fixed monthly amount for lunch</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContractForm['status'] }))}
              required
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes about this contract..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/contracts')}
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
              disabled={submitting}
            >
              Cancel
            </button>

            <IOSButton
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
            >
              {submitting ? '⏳ Creating...' : '✅ Create Contract'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

