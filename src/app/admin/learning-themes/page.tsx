'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.learning-themes'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLearningThemesStore, LearningTheme } from '@/stores/learningThemes'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminLearningThemesPage() {
  const { t } = useI18n()

  const { learningThemes, loading, error, fetchLearningThemes } = useLearningThemesStore()
  const { groups, fetchGroups } = useGroupsStore()
  
  const [selectedGroup, setSelectedGroup] = useState('')

  useEffect(() => {
    fetchLearningThemes(selectedGroup || undefined)
    fetchGroups()
  }, [selectedGroup, fetchLearningThemes, fetchGroups])

  const getGroupName = (id: string) => {
    const g = groups.find(g => g.id === id)
    return g ? g.name : 'Kita-weit'
  }

  if (loading && learningThemes.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">{t(sT('learningThemesListSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/learning-themes/new" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            {t(sT('createNewTheme'))}
          </Link>
        </div>
      </div>

      <div className="mb-10">
        <div className="relative inline-block w-full md:w-64">
            <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full pl-6 pr-12 py-3 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
            >
                <option value="">{t(sT('allGroups'))}</option>
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ui-soft">
                ▼
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {learningThemes.map(theme => (
                <IOSCard key={theme.id} className="p-0 overflow-hidden group hover:border-indigo-100 transition-all duration-500">
                    <div className="h-56 bg-slate-100 overflow-hidden relative">
                        {theme.photos?.[0] ? (
                             <img src={theme.photos[0]} alt={theme.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-6xl bg-indigo-50 text-indigo-100 group-hover:bg-indigo-100 group-hover:text-indigo-200 transition-colors">
                                📚
                                <span className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-40">No Image</span>
                             </div>
                        )}
                        <span className={`absolute top-6 right-6 px-4 py-1.5 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-full border border-white/50 shadow-sm ${
                            theme.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'
                        }`}>
                            {theme.status}
                        </span>
                    </div>
                    <div className="p-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">{getGroupName(theme.group_id || '')}</p>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">{theme.title}</h3>
                        <p className="text-sm text-ui-soft line-clamp-2 mb-10 font-medium leading-relaxed">{theme.description}</p>
                        
                        <div className="flex gap-4 pt-8 border-t border-slate-50">
                             <Link href={`/admin/learning-themes/edit/${theme.id}`} className="flex-1 py-3 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-widest text-center rounded-xl transition-all shadow-sm">
                                Edit Theme
                             </Link>
                             <button className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                →
                             </button>
                        </div>
                    </div>
                </IOSCard>
            ))}
      </div>

      {learningThemes.length === 0 && !loading && (
        <IOSCard className="p-24 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
            <div className="text-6xl opacity-10 mb-6">📚</div>
            <p className="text-slate-500 font-bold text-xl">{t(sT('learningThemesEmptyTitle'))}</p>
            <p className="text-ui-soft mt-2 font-medium">{t(sT('learningThemesEmptyHint'))}</p>
        </IOSCard>
      )}
    </div>
  )
}
