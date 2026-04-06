'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.staff.qualifications'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

type StaffQualification = {
  id: string
  staff_id: string
  qualification_type: 'Erzieher' | 'Kinderpfleger' | 'Heilpädagoge' | 'Fachkraft' | 'Praktikant' | 'other'
  certificate_number?: string | null
  issued_date?: string | null
  expiry_date?: string | null
  issuing_authority?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

type StaffLite = { id: string; full_name: string }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function daysUntil(expiryDate?: string | null) {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpiryStatus(expiryDate?: string | null) {
  if (!expiryDate) return 'No expiry'
  const d = daysUntil(expiryDate)
  if (d === null) return 'No expiry'
  if (d < 0) return 'Expired'
  if (d < 30) return 'Expiring Soon'
  return 'Valid'
}

function getExpiryStatusClass(expiryDate?: string | null) {
  const status = getExpiryStatus(expiryDate)
  if (status === 'Expired') return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  if (status === 'Expiring Soon') return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
  if (status === 'No expiry') return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-slate-800 dark:text-slate-100'
  return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
}

export default function AdminStaffQualificationsPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [qualifications, setQualifications] = useState<StaffQualification[]>([])
  const [staffList, setStaffList] = useState<StaffLite[]>([])
  const [staffMap, setStaffMap] = useState<Record<string, string>>({})

  const [selectedStaffId, setSelectedStaffId] = useState('')

  const loadStaff = async () => {
    const { data, error: staffErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (staffErr) throw staffErr

    const staff = (data || []) as StaffLite[]
    setStaffList(staff)
    const map: Record<string, string> = {}
    staff.forEach((s) => {
      map[s.id] = s.full_name
    })
    setStaffMap(map)
  }

  const loadQualifications = async () => {
    let query = supabase.from('staff_qualifications').select('*')
    if (selectedStaffId) query = query.eq('staff_id', selectedStaffId)
    query = query.order('issued_date', { ascending: false })

    const { data, error: qErr } = await query
    if (qErr) throw qErr
    setQualifications((data || []) as StaffQualification[])
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadStaff(), loadQualifications()])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t(sT('errLoadQualifications')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaffId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6 gap-4">
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <label htmlFor="staff_filter" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Filter by Staff
        </label>
        <select
          id="staff_filter"
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Staff</option>
          {staffList.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Certificate #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Issued</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {qualifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ui-soft">
                  No qualifications found
                </td>
              </tr>
            ) : (
              qualifications.map((qual) => (
                <tr key={qual.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                    {staffMap[qual.staff_id] || qual.staff_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{qual.qualification_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                    {qual.certificate_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-soft">
                    {qual.issued_date ? formatDate(qual.issued_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-soft">
                    {qual.expiry_date ? formatDate(qual.expiry_date) : 'No expiry'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getExpiryStatusClass(qual.expiry_date)}>{getExpiryStatus(qual.expiry_date)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

