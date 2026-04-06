'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ChildProfilePage({ params }: PageProps) {
  const { t } = useI18n()
  const { id } = use(params)
  const [child, setChild] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadChildData()
  }, [id])

  const loadChildData = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('children')
        .select('*, groups(name)')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      if (!data) throw new Error(t(sT('errChildNotFound')))
      setChild(data)
    } catch (e: any) {
      console.error('Error loading child profile:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (error) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <ErrorAlert message={error} />
      <Link href="/parent/dashboard" className="mt-4 inline-block text-[#667eea] font-medium">← Zurück zum Dashboard</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/parent/dashboard"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zum Dashboard
        </Link>
        <div className="flex items-center gap-6 mt-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-xl">
            {child.first_name[0]}{child.last_name[0]}
          </div>
          <div>
            <Heading size="xl" className="text-slate-900 dark:text-slate-50 leading-tight">
              {child.first_name} {child.last_name}
            </Heading>
            <p className="text-sm font-bold text-[#667eea] bg-[#667eea]/10 px-3 py-1 rounded-full border border-[#667eea]/10 inline-block mt-2">
              {child.groups?.name || 'Keine Gruppe zugewiesen'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <IOSCard className="p-0 overflow-hidden">
          <div className="p-6 bg-gray-50/50 border-b border-black/5">
            <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest">Persönliche Informationen</h3>
          </div>
          <div className="divide-y divide-black/5">
            <InfoRow label="Vorname" value={child.first_name} />
            <InfoRow label="Nachname" value={child.last_name} />
            <InfoRow label="Geburtsdatum" value={formatDate(child.date_of_birth)} />
            <InfoRow label="Status" value={child.status === 'active' ? 'Aktiv 🟢' : 'Inaktiv 🔴'} />
          </div>
        </IOSCard>

        <IOSCard className="p-0 overflow-hidden">
          <div className="p-6 bg-gray-50/50 border-b border-black/5">
            <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest">Schnellaktionen</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionCard href={`/parent/attendance?child=${child.id}`} icon="✅" label="Anwesenheit" color="blue" />
            <ActionCard href={`/parent/daily-reports?child=${child.id}`} icon="📝" label="Tagesberichte" color="purple" />
            <ActionCard href={`/parent/lunch?child=${child.id}`} icon="🍽️" label="Mittagessen" color="orange" />
            <ActionCard href={`/parent/messages?child=${child.id}`} icon="💬" label="Nachricht senden" color="green" />
          </div>
        </IOSCard>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-1 sm:gap-4">
      <span className="text-sm font-semibold text-ui-soft">{label}</span>
      <span className="text-base font-bold text-slate-900 dark:text-slate-50">{value}</span>
    </div>
  )
}

function ActionCard({ href, icon, label, color }: { href: string, icon: string, label: string, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100',
    green: 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
  }

  return (
    <Link href={href}>
      <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${colors[color] || ''} group`}>
        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
        <span className="font-bold text-sm">{label}</span>
      </div>
    </Link>
  )
}
