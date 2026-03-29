'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.attendance'

import React, { useEffect, useState, useMemo } from 'react'
import { useAttendanceStore } from '@/stores/attendance'
import { useChildrenStore } from '@/stores/children'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

export default function AdminAttendancePage() {
  const { t } = useI18n()

  const { attendance, loading, error, fetchAttendance } = useAttendanceStore()
  const { children, fetchChildren } = useChildrenStore()
  const { groups, fetchGroups } = useGroupsStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedGroup, setSelectedGroup] = useState('')

  useEffect(() => {
    fetchChildren()
    fetchGroups()
    fetchAttendance(undefined, selectedDate)
  }, [selectedDate, fetchChildren, fetchGroups, fetchAttendance])

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getChildGroup = (childId: string) => {
    const child = children.find(c => c.id === childId)
    if (!child) return null
    const group = groups.find(g => g.id === child.group_id)
    return group ? group.name : null
  }

  const formatTime = (time?: string) => {
    if (!time) return '-'
    return new Date(time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const filteredAttendance = useMemo(() => {
    if (!selectedGroup) return attendance
    return attendance.filter(record => {
      const child = children.find(c => c.id === record.child_id)
      return child?.group_id === selectedGroup
    })
  }, [attendance, selectedGroup, children])

  const stats = useMemo(() => {
    const total = filteredAttendance.length
    const present = filteredAttendance.filter(r => r.status === 'present').length
    const absent = filteredAttendance.filter(r => r.status === 'absent').length
    return { total, present, absent }
  }, [filteredAttendance])

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Überwachen Sie die tägliche Anwesenheit aller Kinder in Echtzeit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <IOSCard className="p-6 bg-white border-black/5 shadow-sm">
            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Gesamt erwartet</p>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </IOSCard>
        <IOSCard className="p-6 bg-green-50/50 border-green-100 shadow-sm">
            <p className="text-[10px] font-black text-green-700/40 uppercase tracking-widest mb-1">Anwesend</p>
            <p className="text-2xl font-black text-green-700">{stats.present}</p>
        </IOSCard>
        <IOSCard className="p-6 bg-red-50/50 border-red-100 shadow-sm">
            <p className="text-[10px] font-black text-red-700/40 uppercase tracking-widest mb-1">Abwesend</p>
            <p className="text-2xl font-black text-red-700">{stats.absent}</p>
        </IOSCard>
        <IOSCard className="p-6 bg-blue-50/50 border-blue-100 shadow-sm">
            <p className="text-[10px] font-black text-blue-700/40 uppercase tracking-widest mb-1">Datum</p>
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent font-black text-blue-900 border-none p-0 outline-none cursor-pointer"
            />
        </IOSCard>
      </div>

      <IOSCard className="p-6 mb-8 border-black/5 bg-[#f2f2f7]/30 shadow-sm">
          <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Filter nach Gruppe:</span>
              <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-black uppercase tracking-widest text-gray-900 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
              >
                  <option value="">Alle Gruppen</option>
                  {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
          </div>
      </IOSCard>

      {loading && filteredAttendance.length === 0 ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Anwesenheit'} />
      ) : filteredAttendance.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">📋</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Keine Anwesenheitsdaten für diesen Tag und Filter vorhanden.</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-0 overflow-hidden shadow-sm border-black/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Kind</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Gruppe</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Check In</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Check Out</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {filteredAttendance.map(record => (
                            <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-black text-black/20 italic">
                                            {getChildName(record.child_id).charAt(0)}
                                        </div>
                                        <span className="font-black text-gray-900 underline-offset-4 decoration-[#667eea]/30 hover:underline">{getChildName(record.child_id)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 rounded-md border border-black/5">
                                        {getChildGroup(record.child_id) || 'Unbekannt'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-gray-800 italic">{formatTime(record.check_in_time)}</td>
                                <td className="px-6 py-5 text-sm font-bold text-gray-400">{formatTime(record.check_out_time)}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                                        record.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' :
                                        record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-100' :
                                        'bg-amber-50 text-amber-700 border-amber-100'
                                    }`}>
                                        {record.status === 'present' ? 'Anwesend' : record.status === 'absent' ? 'Abwesend' : record.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </IOSCard>
      )}
    </div>
  )
}
