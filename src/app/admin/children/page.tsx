'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.children'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useChildrenStore } from '@/stores/children'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminChildrenPage() {
  const { t, lang } = useI18n()
  const dateLocale = lang === 'de' ? 'de-DE' : lang === 'tr' ? 'tr-TR' : 'en-US'

  const router = useRouter()
  const { children, loading, error, fetchChildren } = useChildrenStore()
  const { groups, fetchGroups } = useGroupsStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  useEffect(() => {
    fetchChildren()
    fetchGroups()
  }, [fetchChildren, fetchGroups])

  const filteredChildren = useMemo(() => {
    return children.filter(child => {
      const fullName = `${child.first_name} ${child.last_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchTerm.toLowerCase())
      const matchesGroup = !selectedGroup || child.group_id === selectedGroup
      return matchesSearch && matchesGroup
    })
  }, [children, searchTerm, selectedGroup])

  const getGroupName = (groupId: string | null | undefined) => {
    if (!groupId) return 'Nicht zugewiesen'
    const group = groups.find(g => g.id === groupId)
    return group ? group.name : 'Unbekannt'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(dateLocale)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-50 text-green-700 border-green-100',
      inactive: 'bg-gray-50 text-gray-500 border-gray-100',
      pending: 'bg-amber-50 text-amber-700 border-amber-100'
    }
    const labels: Record<string, string> = {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      pending: 'Anmeldung'
    }
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${styles[status] || styles.inactive}`}>
            {labels[status] || status}
        </span>
    )
  }

  if (loading && children.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">{t(sT('childrenListSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/children/new" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            {t(sT('addNewChild'))}
          </Link>
        </div>
      </div>

      <IOSCard className="p-8 mb-12 border-slate-100 bg-white shadow-xl shadow-slate-200/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 relative">
                <input
                    type="text"
                    placeholder={t(sT('searchByNamePlaceholder'))}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">🔍</span>
            </div>
            <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all appearance-none cursor-pointer"
            >
                <option value="">{t(sT('allGroups'))}</option>
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
        </div>
      </IOSCard>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Kinder'} />
      ) : filteredChildren.length === 0 ? (
        <IOSCard className="p-24 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
          <div className="text-6xl opacity-10 mb-6">👶</div>
          <p className="text-slate-500 font-bold text-xl">
            {searchTerm || selectedGroup ? t(sT('noChildrenFiltered')) : t(sT('noChildrenSystem'))}
          </p>
          <p className="text-slate-400 mt-2 font-medium">{t(sT('tryAdjustFiltersChildren'))}</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredChildren.map(child => (
                <Link key={child.id} href={`/admin/children/${child.id}`}>
                    <IOSCard className="p-0 overflow-hidden group hover:border-indigo-100 transition-all duration-500">
                        <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                            {/* Placeholder for Profile Image */}
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 text-indigo-200 text-5xl font-black">
                                {child.first_name[0]}{child.last_name[0]}
                            </div>
                            <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform duration-500">
                                {getStatusBadge(child.status)}
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                                    {child.first_name} {child.last_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{getGroupName(child.group_id)}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Birthday</span>
                                    <span className="text-xs font-bold text-slate-500">{formatDate(child.date_of_birth)}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    →
                                </div>
                            </div>
                        </div>
                    </IOSCard>
                </Link>
            ))}
        </div>
      )}
    </div>
  )
}
