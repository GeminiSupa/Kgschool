'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.config'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export default function AdminLunchBillingConfigPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deadlineHours, setDeadlineHours] = useState<number>(16)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')

        const { data, error: cfgError } = await supabase
          .from('billing_config')
          .select('*')
          .eq('key', 'informed_absence_deadline_hours')
          .maybeSingle()

        if (cfgError) throw cfgError
        if (data && data.value != null) {
          const parsed = parseInt(String(data.value), 10)
          if (!Number.isNaN(parsed)) setDeadlineHours(parsed)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { error: upsertError } = await supabase.from('billing_config').upsert({
        key: 'informed_absence_deadline_hours',
        value: deadlineHours.toString(),
        description: 'Hours before 8 AM on the absence date that parents must notify',
      })

      if (upsertError) throw upsertError
      alert('Configuration saved successfully!')
      router.push('/admin/lunch/billing')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/lunch/billing')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Billing
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        {error && <ErrorAlert message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="deadline_hours" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Informed Absence Deadline (Hours)
              </label>
              <input
                id="deadline_hours"
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(Number(e.target.value))}
                type="number"
                min={1}
                max={48}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-ui-soft mt-1">
                Number of hours before 8 AM on the absence date that parents must notify.
                For example, 16 hours means parents must notify by 4 PM the day before.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <IOSButton type="button" variant="secondary" onClick={() => router.push('/admin/lunch/billing')} disabled={saving}>
                Cancel
              </IOSButton>
              <IOSButton type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </IOSButton>
            </div>
          </form>
        )}
      </IOSCard>
    </div>
  )
}

