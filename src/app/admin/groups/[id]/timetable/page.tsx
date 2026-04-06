'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useTimetableStore } from '@/stores/timetables'
import { useGroupsStore } from '@/stores/groups'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

export default function GroupTimetablePage() {
  const { t } = useI18n()
  const { id } = useParams()
  const router = useRouter()
  const { fetchGroupById } = useGroupsStore()
  const { timetables, fetchTimetable, updateTimetable, loading } = useTimetableStore()
  
  const [group, setGroup] = useState<any>(null)
  const [localTimetable, setLocalTimetable] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    notes: ''
  })

  useEffect(() => {
    async function loadData() {
      const g = await fetchGroupById(id as string)
      setGroup(g)
      await fetchTimetable(id as string)
    }
    loadData()
  }, [id])

  useEffect(() => {
    const current = timetables[id as string]
    if (current) {
      setLocalTimetable({
        monday: current.monday,
        tuesday: current.tuesday,
        wednesday: current.wednesday,
        thursday: current.thursday,
        friday: current.friday,
        saturday: current.saturday,
        sunday: current.sunday,
        notes: current.notes || ''
      })
    }
  }, [timetables, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateTimetable(id as string, localTimetable)
      alert(t(sT('timetableUpdated')))
      router.push(`/admin/groups/${id}`)
    } catch (error: any) {
      alert(error.message || t(sT('errorUpdatingTimetable')))
    }
  }

  if (loading && !group) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!group) return <div className="max-w-4xl mx-auto py-12 text-center text-ui-soft">{t(sT('groupNotFound'))}</div>

  const days = [
    { key: 'monday', labelKey: 'dayMon' as const },
    { key: 'tuesday', labelKey: 'dayTue' as const },
    { key: 'wednesday', labelKey: 'dayWed' as const },
    { key: 'thursday', labelKey: 'dayThu' as const },
    { key: 'friday', labelKey: 'dayFri' as const },
    { key: 'saturday', labelKey: 'daySat' as const },
    { key: 'sunday', labelKey: 'daySun' as const },
  ]

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-12">
        <Link href={`/admin/groups/${id}`} className="text-sm font-black text-indigo-600 mb-4 inline-flex items-center gap-1 hover:-translate-x-1 transition-all uppercase tracking-widest">
          {t(sT('backToGroup')).replace('{{name}}', group.name)}
        </Link>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-4 font-display">{t(sT('groupTimetableTitle'))}</h1>
        <p className="text-lg text-slate-500 font-medium mt-2">{t(sT('groupTimetableSubtitle'))}</p>
      </div>

      <IOSCard className="p-10 border-slate-50 shadow-xl shadow-slate-200/40">
        <form onSubmit={handleSave} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {days.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900">{t(sT(labelKey))}</span>
                  <span className="text-[10px] font-bold text-ui-soft uppercase tracking-widest mt-1">{t(sT('operationalDay'))}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={(localTimetable as any)[key]}
                    onChange={(e) => setLocalTimetable({...localTimetable, [key]: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-50">
            <label className="text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">{t(sT('notesSpecialLabel'))}</label>
            <textarea 
              value={localTimetable.notes}
              onChange={(e) => setLocalTimetable({...localTimetable, notes: e.target.value})}
              placeholder={t(sT('notesPlaceholder'))}
              className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all min-h-[120px]"
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {loading ? t(sT('savingChanges')) : t(sT('saveTimetableConfig'))}
            </button>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}
