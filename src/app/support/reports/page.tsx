'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

type AttendanceRow = { date: string; status: 'present' | 'absent' | string }

type DayBreakdown = {
  date: string
  present: number
  absent: number
  total: number
  rate: number
}

type ReportData = {
  totalDays: number
  presentDays: number
  absentDays: number
  attendanceRate: number
  dailyBreakdown: DayBreakdown[]
}

export default function SupportReportsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  const [reportForm, setReportForm] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  })

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const generateReport = async () => {
    setLoading(true)
    setGenerating(true)
    setError('')
    setReportData(null)

    try {
      const { data, error: fetchErr } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', reportForm.startDate)
        .lte('date', reportForm.endDate)

      if (fetchErr) throw fetchErr

      const rows = (data || []) as AttendanceRow[]
      const presentDays = rows.filter((a) => a.status === 'present').length || 0
      const absentDays = rows.filter((a) => a.status === 'absent').length || 0
      const uniqueDates = [...new Set(rows.map((a) => a.date))].filter(Boolean)
      const totalDays = uniqueDates.length

      const dailyBreakdown = uniqueDates
        .map((date) => {
          const dayRecords = rows.filter((a) => a.date === date) || []
          const present = dayRecords.filter((a) => a.status === 'present').length
          const absent = dayRecords.filter((a) => a.status === 'absent').length
          const total = dayRecords.length
          const rate = total > 0 ? Math.round((present / total) * 100) : 0
          return { date, present, absent, total, rate }
        })
        .sort((a, b) => a.date.localeCompare(b.date))

      setReportData({
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        dailyBreakdown,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    generateReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Attendance Reports
      </Heading>

      <IOSCard className="p-6 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            generateReport()
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date</label>
            <input
              type="date"
              value={reportForm.startDate}
              onChange={(e) => setReportForm((p) => ({ ...p, startDate: e.target.value }))}
              required
              className="w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">End Date</label>
            <input
              type="date"
              value={reportForm.endDate}
              onChange={(e) => setReportForm((p) => ({ ...p, endDate: e.target.value }))}
              required
              className="w-full rounded-lg border-2 border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:opacity-50 dark:focus-visible:ring-indigo-500/50"
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </form>
      </IOSCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : reportData ? (
        <div className="space-y-6">
          <IOSCard className="p-6">
            <Heading size="md" className="mb-4">
              Summary
            </Heading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-500/10 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/40">
                <p className="text-sm text-ui-muted">Total Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{reportData.totalDays}</p>
              </div>
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-500/10 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                <p className="text-sm text-ui-muted">Present Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{reportData.presentDays}</p>
              </div>
              <div className="rounded-xl border border-red-200/60 bg-red-500/10 p-4 dark:border-red-500/20 dark:bg-red-950/40">
                <p className="text-sm text-ui-muted">Absent Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{reportData.absentDays}</p>
              </div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-500/10 p-4 dark:border-amber-500/20 dark:bg-amber-950/40">
                <p className="text-sm text-ui-muted">Attendance Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{reportData.attendanceRate}%</p>
              </div>
            </div>
          </IOSCard>

          <IOSCard className="p-0 overflow-hidden">
            <Heading size="md" className="border-b border-border p-6">
              Daily Breakdown
            </Heading>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {reportData.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{formatDate(day.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400">{day.present}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{day.absent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{day.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IOSCard>
        </div>
      ) : null}
    </div>
  )
}

