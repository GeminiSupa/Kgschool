'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.children'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

export default function ParentChildrenIndexPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadChildren()
    }
  }, [user?.id])

  const loadChildren = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*, groups(name)')
        .contains('parent_ids', [user?.id])
        .order('first_name')
      
      if (fetchError) throw fetchError
      setMyChildren(data || [])
    } catch (e: any) {
      console.error('Error loading children:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (error) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <ErrorAlert message={error} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Verwalten Sie die Profile Ihrer Kinder.</p>
      </div>

      {myChildren.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="text-5xl opacity-40 mb-4">👶</div>
          <p className="text-gray-500 font-medium">Noch keine Kinder registriert.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-4">
          {myChildren.map(child => (
            <Link key={child.id} href={`/parent/children/${child.id}`} className="block group">
              <IOSCard className="p-0 overflow-hidden hover:shadow-lg transition-all duration-300 border-black/5 group-hover:border-[#667eea]/30">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-2xl font-black shadow-inner border-2 border-white/20">
                      {child.first_name[0]}{child.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#667eea] transition-colors">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm font-bold text-[#667eea] bg-[#667eea]/10 px-3 py-0.5 rounded-full border border-[#667eea]/10 inline-block mt-1">
                        {child.groups?.name || 'Keine Gruppe zugewiesen'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${child.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {child.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <div className="text-gray-300 group-hover:text-[#667eea] transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
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
