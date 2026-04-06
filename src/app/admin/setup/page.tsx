'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.setup'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { sT } from '@/i18n/sT'

type SetupStatus = {
  kitaId: string
  groups: number
  staffMembers: number
  children: number
  contracts: number
  feeConfigs: number
  lunchMenus: number
}

export default function AdminSetupPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<SetupStatus | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const kitaId = await getActiveKitaId()
        if (!kitaId) throw new Error(t(sT('errKitaNotFound')))

        const [{ count: groups }, { count: children }, { count: contracts }, { count: feeConfigs }, { count: lunchMenus }] =
          await Promise.all([
            supabase.from('groups').select('id', { count: 'exact', head: true }).eq('kita_id', kitaId),
            supabase.from('children').select('id', { count: 'exact', head: true }).eq('kita_id', kitaId),
            supabase.from('child_contracts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('fee_configs').select('id', { count: 'exact', head: true }),
            supabase.from('lunch_menus').select('id', { count: 'exact', head: true }).eq('kita_id', kitaId),
          ])

        const { data: members } = await supabase.from('organization_members').select('profile_id').eq('kita_id', kitaId)
        const memberIds = members?.map((m) => m.profile_id) || []
        const { count: staffMembers } =
          memberIds.length > 0
            ? await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .in('id', memberIds)
                .in('role', ['teacher', 'support', 'kitchen'])
            : { count: 0 as number | null }

        setStatus({
          kitaId,
          groups: groups || 0,
          staffMembers: staffMembers || 0,
          children: children || 0,
          contracts: contracts || 0,
          feeConfigs: feeConfigs || 0,
          lunchMenus: lunchMenus || 0,
        })
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t(sT('errLoadSetup'))
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [supabase])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Go-Live Checkliste für Ihre Kita.</p>
      </div>

      {error && (
        <IOSCard className="p-6 border-red-200 bg-red-50/40">
          <p className="text-sm font-bold text-red-700">{error}</p>
        </IOSCard>
      )}

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IOSCard className="p-6 border-black/5">
            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Stammdaten</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold">Gruppen</span>
                <span className="font-black">{status.groups}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold">Kinder</span>
                <span className="font-black">{status.children}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold">Personal</span>
                <span className="font-black">{status.staffMembers}</span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/admin/groups/new" className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white hover:bg-black">
                Gruppe anlegen
              </Link>
              <Link href="/admin/children/new" className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">
                Kind anlegen
              </Link>
              <Link href="/admin/users/new" className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">
                Benutzer einladen
              </Link>
            </div>
          </IOSCard>

          <IOSCard className="p-6 border-black/5">
            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Finanzen & Lunch</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="font-semibold">Aktive Verträge</span>
                <span className="font-black">{status.contracts}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold">Gebühren-Konfiguration</span>
                <span className="font-black">{status.feeConfigs}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-semibold">Lunch-Menüs</span>
                <span className="font-black">{status.lunchMenus}</span>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/admin/contracts/new" className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white hover:bg-black">
                Vertrag erstellen
              </Link>
              <Link href="/admin/fees/config" className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">
                Gebühren konfigurieren
              </Link>
              <Link href="/admin/lunch/menus/new" className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">
                Menü erstellen
              </Link>
            </div>
          </IOSCard>

          <IOSCard className="p-6 border-black/5 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Website & Platzanfrage</p>
                <p className="mt-2 text-sm text-ui-muted">Richten Sie Ihre öffentliche Seite ein und verbinden Sie sie mit dem Bewerbungsprozess.</p>
              </div>
              <Link href="/admin/site" className="rounded-2xl bg-[#667eea] px-5 py-3 text-xs font-black text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
                Website bearbeiten
              </Link>
            </div>
          </IOSCard>
        </div>
      )}
    </div>
  )
}

