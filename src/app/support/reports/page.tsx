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
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={reportForm.startDate}
              onChange={(e) => setReportForm((p) => ({ ...p, startDate: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={reportForm.endDate}
              onChange={(e) => setReportForm((p) => ({ ...p, endDate: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={generating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalDays}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-sm text-gray-600">Present Days</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.presentDays}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-sm text-gray-600">Absent Days</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.absentDays}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.attendanceRate}%</p>
              </div>
            </div>
          </IOSCard>

          <IOSCard className="p-0 overflow-hidden">
            <Heading size="md" className="p-6 border-b">
              Daily Breakdown
            </Heading>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.dailyBreakdown.map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(day.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{day.present}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{day.absent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.rate}%</td>
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

