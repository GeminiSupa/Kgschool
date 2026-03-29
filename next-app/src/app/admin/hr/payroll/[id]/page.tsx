'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.payroll.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IOSCard } from '@/components/ui/IOSCard'
import { Heading } from '@/components/ui/Heading'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSButton } from '@/components/ui/IOSButton'
import { usePayrollStore, type StaffPayroll } from '@/stores/payroll'
import { useStaffStore } from '@/stores/staff'
import { PayrollForm } from '@/components/forms/PayrollForm'

export default function AdminPayrollDetailsPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams<{ id: string }>()
  const payrollId = params?.id

  const payrollStore = usePayrollStore()
  const { staff, fetchStaff } = useStaffStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payrollRecord, setPayrollRecord] = useState<StaffPayroll | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const getStaffName = (staffId: string) => {
    const s = staff.find((st) => st.id === staffId)
    return s ? s.full_name : staffId
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([payrollStore.fetchPayroll(), fetchStaff()])
        if (!payrollId) throw new Error('Payroll record not found')
        const found = payrollStore.payroll.find((p) => p.id === payrollId) || null
        if (!found) {
          setError('Payroll record not found')
          setPayrollRecord(null)
          return
        }
        setPayrollRecord(found)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load payroll')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollId])

  const refreshPayroll = async () => {
    await payrollStore.fetchPayroll()
    if (!payrollId) return
    const found = payrollStore.payroll.find((p) => p.id === payrollId) || null
    setPayrollRecord(found)
  }

  const handleUpdate = async (data: Partial<StaffPayroll>) => {
    if (!payrollId) return
    try {
      await payrollStore.updatePayroll(payrollId, data)
      alert('Payroll updated successfully!')
      setShowEditForm(false)
      await refreshPayroll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update payroll')
    }
  }

  const markAsPaid = async () => {
    if (!payrollId) return
    if (!confirm('Mark this payroll as paid?')) return
    try {
      await payrollStore.markAsPaid(payrollId)
      await refreshPayroll()
      alert('Payroll marked as paid!')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to mark as paid')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/hr/payroll')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Payroll
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : payrollRecord ? (
        <div className="space-y-6">
          <IOSCard className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Staff Member</label>
                <p className="mt-1 text-gray-900">{getStaffName(payrollRecord.staff_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Period</label>
                <p className="mt-1 text-gray-900">
                  {getMonthName(payrollRecord.month)} {payrollRecord.year}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Base Salary</label>
                <p className="mt-1 text-gray-900">€{payrollRecord.base_salary.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Overtime Amount</label>
                <p className="mt-1 text-gray-900">€{payrollRecord.overtime_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Bonuses</label>
                <p className="mt-1 text-green-600">€{payrollRecord.bonuses.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Deductions</label>
                <p className="mt-1 text-red-600">€{payrollRecord.deductions.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Tax Amount</label>
                <p className="mt-1 text-gray-900">€{payrollRecord.tax_amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Net Salary</label>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  €{payrollRecord.net_salary.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <span
                className={[
                  'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full',
                  payrollRecord.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : payrollRecord.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800',
                ].join(' ')}
              >
                {payrollRecord.status}
              </span>
            </div>

            {payrollRecord.notes && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Notes</label>
                <p className="mt-1 text-gray-900">{payrollRecord.notes}</p>
              </div>
            )}

            {payrollRecord.status !== 'paid' && (
              <div className="pt-4 border-t flex gap-2">
                <IOSButton
                  onClick={() => setShowEditForm(true)}
                  variant="primary"
                  className="px-4 py-2"
                >
                  Edit
                </IOSButton>
                <IOSButton
                  onClick={() => void markAsPaid()}
                  variant="secondary"
                  className="px-4 py-2 bg-green-600 text-white border-none"
                >
                  Mark as Paid
                </IOSButton>
              </div>
            )}
          </IOSCard>

          {showEditForm && (
            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Edit Payroll
              </Heading>
              <PayrollForm
                staffId={payrollRecord.staff_id}
                initialData={payrollRecord}
                onSubmit={(data) => void handleUpdate(data)}
                onCancel={() => setShowEditForm(false)}
              />
            </IOSCard>
          )}
        </div>
      ) : (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <p className="text-gray-400 font-bold">No payroll record found.</p>
        </IOSCard>
      )}
    </div>
  )
}

