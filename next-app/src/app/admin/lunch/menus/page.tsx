'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.menus'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLunchStore, LunchMenu } from '@/stores/lunch'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminLunchMenusPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { menus, loading, error, fetchMenus } = useLunchStore()
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (profile?.kita_id) {
        fetchMenus(startDate, undefined, profile.kita_id)
    }
  }, [profile, startDate, fetchMenus])

  if (loading && menus.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Verwalten Sie die täglichen Menüs für Ihre Kita.</p>
        </div>
        <Link href="/admin/lunch/menus/new">
          <IOSButton className="px-6 py-2.5 text-sm font-black uppercase tracking-widest bg-black text-white border-none shadow-xl shadow-black/10">
            ➕ Menü hinzufügen
          </IOSButton>
        </Link>
      </div>

      <div className="mb-10 flex gap-4">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest ml-1">Anzeigen ab</span>
                <input 
                    type="date"
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-5 py-2.5 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-[#667eea]/20 outline-none transition-all"
                />
            </div>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden des Speiseplans'} />
      ) : menus.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">🍽️</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Keine Menüs für diesen Zeitraum vorhanden.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menus.map(menu => (
                <IOSCard key={menu.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-2xl transition-all duration-500">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {menu.photo_url ? (
                            <img src={menu.photo_url} alt={menu.meal_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 bg-gradient-to-br from-gray-50 to-gray-200">🥘</div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                {new Date(menu.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-[#667eea] transition-colors">{menu.meal_name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 font-medium leading-relaxed">{menu.description || 'Keine Beschreibung vorhanden.'}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-8">
                            {menu.allergens?.map(a => (
                                <span key={a} className="px-2 py-0.5 bg-red-50 text-red-500 border border-red-100/50 text-[9px] font-black uppercase rounded-md">{a}</span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                             <Link href={`/admin/lunch/menus/${menu.id}`} className="flex-1">
                                <IOSButton variant="secondary" className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">Details</IOSButton>
                             </Link>
                             <Link href={`/admin/lunch/menus/${menu.id}/edit`}>
                                <IOSButton className="p-2.5 bg-white border border-black/5 text-[#667eea] hover:border-[#667eea]/40">✏️</IOSButton>
                             </Link>
                        </div>
                    </div>
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
