'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

type MonthlyBilling = {
  id: string
  child_id: string
  month: number
  year: number
  total_amount: number
  paid_amount: number
  refund_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  billing_date: string
  due_date: string
  document_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

type BillingItem = {
  id: string
  billing_id: string
  order_id?: string
  date: string
  meal_price: number
  is_informed_absence: boolean
  is_refundable: boolean
  refunded: boolean
  refund_date?: string
  notes?: string
  created_at: string
}

type AuditLog = {
  id: string
  billing_id: string
  adjustment_type: 'amount' | 'status' | 'payment' | 'refund' | string
  adjusted_by: string
  created_at: string
  previous_total_amount: number
  new_total_amount: number
  previous_paid_amount: number
  new_paid_amount: number
  previous_refund_amount: number
  new_refund_amount: number
  reason?: string
  notes?: string
}

export default function AdminLunchBillingDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const billingId = params.id

  const supabase = useMemo(() => createClient(), [])
  const childrenStore = useChildrenStore()

  const { children, fetchChildren } = childrenStore

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [bill, setBill] = useState<MonthlyBilling | null>(null)
  const [items, setItems] = useState<BillingItem[]>([])
  const [auditLog, setAuditLog] = useState<AuditLog[]>([])
  const [adminNames, setAdminNames] = useState<Record<string, string>>({})

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()
  const formatDateTime = (date: string) => new Date(date).toLocaleString()

  const formatAdjustmentType = (type: string) => {
    const map: Record<string, string> = {
      amount: t(sT('billAdjAmount')),
      status: t(sT('billAdjStatus')),
      payment: t(sT('billAdjPayment')),
      refund: t(sT('billAdjRefund')),
    }
    return map[type] || type
  }

  useEffect(() => {
    const run = async () => {
      if (!billingId) {
        setError(t(sT('errNotFoundBill')))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        await fetchChildren(undefined)

        const { data: billData, error: billError } = await supabase
          .from('monthly_billing')
          .select('*')
          .eq('id', billingId)
          .maybeSingle()

        if (billError) throw billError
        if (!billData) {
          setBill(null)
          setError(t(sT('errNotFoundBill')))
          return
        }

        const typedBill = billData as MonthlyBilling
        setBill(typedBill)

        const { data: itemsData, error: itemsError } = await supabase
          .from('lunch_billing_items')
          .select('*')
          .eq('billing_id', billingId)
          .order('date', { ascending: true })

        if (itemsError) throw itemsError
        setItems((itemsData || []) as BillingItem[])

        const { data: auditData, error: auditError } = await supabase
          .from('billing_audit_log')
          .select('*')
          .eq('billing_id', billingId)
          .order('created_at', { ascending: false })

        if (auditError) throw auditError
        const typedAudit = (auditData || []) as AuditLog[]
        setAuditLog(typedAudit)

        const adminIds = Array.from(new Set(typedAudit.map((l) => l.adjusted_by).filter(Boolean)))
        const kitaId = await getActiveKitaId()
        const tenantIds = kitaId ? await getProfileIdsForKita(supabase, kitaId) : []
        const scopedAdminIds = adminIds.filter((id) => tenantIds.includes(id))
        if (scopedAdminIds.length > 0) {
          const { data: adminsData, error: adminsError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', scopedAdminIds)

          if (!adminsError && adminsData) {
            setAdminNames(
              (adminsData || []).reduce<Record<string, string>>((acc, a) => {
                acc[String(a.id)] = String(a.full_name || '')
                return acc
              }, {})
            )
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t(sT('errLoadBill')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingId, t])

  const getAdminName = (adminId: string) => adminNames[adminId] || t(sT('labelSystem'))

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/lunch/billing')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Billing
        </button>
        <Heading size="xl" className="mt-2">
          Billing Details
        </Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : !bill ? (
        <IOSCard className="p-8 text-center bg-gray-50/30 border-black/5 max-w-3xl mx-auto">
          {t(sT('errNotFoundBill'))}
        </IOSCard>
      ) : (
        <div className="space-y-6 max-w-6xl mx-auto px-2">
          <IOSCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-ui-muted">Child</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{getChildName(bill.child_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Period</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">
                  {getMonthName(bill.month)} {bill.year}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Total Amount</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">€{bill.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Status</label>
                <span
                  className={[
                    'inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full',
                    bill.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : bill.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800',
                  ].join(' ')}
                >
                  {bill.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t mt-4">
              <div>
                <label className="block text-sm font-medium text-ui-muted">Paid Amount</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">€{bill.paid_amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Refund Amount</label>
                <p className="mt-1 text-lg text-green-600">€{bill.refund_amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Due Date</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{formatDate(bill.due_date)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-muted">Billing Date</label>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{formatDate(bill.billing_date)}</p>
              </div>
            </div>
          </IOSCard>

          <IOSCard className="p-6">
            <Heading size="md" className="mb-4">
              Billing Items
            </Heading>
            {items.length === 0 ? (
              <div className="text-ui-soft text-sm">No billing items found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Refundable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Refunded</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                          €{item.meal_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-ui-soft">
                          {item.is_informed_absence
                            ? 'Informed Absence'
                            : item.order_id
                              ? 'Order'
                              : 'Uninformed Absence'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={[
                              'inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full',
                              item.is_refundable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-slate-800 dark:text-slate-100',
                            ].join(' ')}
                          >
                            {item.is_refundable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={[
                              'inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full',
                              item.refunded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-slate-800 dark:text-slate-100',
                            ].join(' ')}
                          >
                            {item.refunded ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </IOSCard>

          <IOSCard className="p-6">
            <Heading size="md" className="mb-4">
              Adjustment History
            </Heading>
            {auditLog.length === 0 ? (
              <div className="text-ui-soft text-sm">No adjustments have been made to this bill.</div>
            ) : (
              <div className="space-y-3">
                {auditLog.map((log) => (
                  <div key={log.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatAdjustmentType(log.adjustment_type)}</p>
                        <p className="text-xs text-ui-soft mt-1">
                          Adjusted by {getAdminName(log.adjusted_by)} on {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                    {log.previous_total_amount !== log.new_total_amount && (
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-medium">Total Amount:</span>{' '}
                        <span className="line-through text-red-600 ml-2">€{log.previous_total_amount.toFixed(2)}</span>
                        <span className="text-green-600 ml-2">→ €{log.new_total_amount.toFixed(2)}</span>
                      </p>
                    )}
                    {log.previous_paid_amount !== log.new_paid_amount && (
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                        <span className="font-medium">Paid Amount:</span>{' '}
                        <span className="line-through text-red-600 ml-2">€{log.previous_paid_amount.toFixed(2)}</span>
                        <span className="text-green-600 ml-2">→ €{log.new_paid_amount.toFixed(2)}</span>
                      </p>
                    )}
                    {log.previous_refund_amount !== log.new_refund_amount && (
                      <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                        <span className="font-medium">Refund Amount:</span>{' '}
                        <span className="line-through text-red-600 ml-2">€{log.previous_refund_amount.toFixed(2)}</span>
                        <span className="text-green-600 ml-2">→ €{log.new_refund_amount.toFixed(2)}</span>
                      </p>
                    )}
                    {log.reason && <div className="mt-2 text-sm text-ui-muted">Reason: {log.reason}</div>}
                    {log.notes && <div className="mt-1 text-xs text-ui-soft">{log.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </IOSCard>
        </div>
      )}
    </div>
  )
}

