'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.staff.qualifications'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'
import { IOSCard } from '@/components/ui/IOSCard'

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
  const base =
    'px-2 py-1 text-xs font-black uppercase tracking-wide rounded-full border border-black/5 dark:border-white/10'
  if (status === 'Expired') return `${base} bg-red-50 text-red-800 dark:bg-red-400/10 dark:text-red-200`
  if (status === 'Expiring Soon') return `${base} bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200`
  if (status === 'No expiry') return `${base} bg-slate-50 text-slate-800 dark:bg-white/5 dark:text-slate-200`
  return `${base} bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200`
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
    const kitaId = await getActiveKitaId()
    if (!kitaId) {
      setStaffList([])
      setStaffMap({})
      return
    }
    const tenantIds = await getProfileIdsForKita(supabase, kitaId)
    if (tenantIds.length === 0) {
      setStaffList([])
      setStaffMap({})
      return
    }

    const { data, error: staffErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', tenantIds)
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

      <IOSCard className="p-4">
        <label htmlFor="staff_filter" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Filter by Staff
        </label>
        <select
          id="staff_filter"
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="ui-select w-full md:w-64"
        >
          <option value="">All Staff</option>
          {staffList.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.full_name}
            </option>
          ))}
        </select>
      </IOSCard>

      <IOSCard className="overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-slate-50/70 dark:bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Certificate #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Issued</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {qualifications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ui-soft">
                  No qualifications found
                </td>
              </tr>
            ) : (
              qualifications.map((qual) => (
                <tr key={qual.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
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
      </IOSCard>
    </div>
  )
}

