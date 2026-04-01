'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.groups'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminGroupsPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { groups, loading, error, fetchGroups } = useGroupsStore()

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  if (loading && groups.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">{t(sT('groupsListSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/groups/new" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            {t(sT('createNewGroup'))}
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Gruppen'} />
      ) : groups.length === 0 ? (
        <IOSCard className="p-24 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
          <div className="text-6xl opacity-10 mb-6">🏫</div>
          <p className="text-slate-500 font-bold text-xl">{t(sT('noGroupsSystem'))}</p>
          <p className="text-slate-400 mt-2 font-medium">{t(sT('noGroupsHint'))}</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {groups.map(group => (
                <Link key={group.id} href={`/admin/groups/${group.id}`}>
                    <IOSCard className="p-0 overflow-hidden group hover:border-indigo-100 transition-all duration-500">
                        <div className="p-10 bg-white">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-sm border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    🏫
                                </div>
                                <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border ${
                                    group.age_range.includes('U3') ? 'bg-amber-100 text-amber-700 border-amber-50' : 'bg-emerald-100 text-emerald-700 border-emerald-50'
                                }`}>
                                    {group.age_range}
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">{group.name}</h3>
                            <p className="text-sm font-bold text-slate-400 mb-10 line-clamp-2 leading-relaxed">{group.description || 'No description provided for this group.'}</p>
                            
                            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Capacity</p>
                                    <p className="text-sm font-black text-slate-700">{group.capacity} Children</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-sm font-black text-emerald-500 uppercase tracking-tight">Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-10 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-all duration-300">Details & Staffing →</span>
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">✏️</div>
                        </div>
                    </IOSCard>
                </Link>
            ))}
        </div>
      )}
    </div>
  )
}
