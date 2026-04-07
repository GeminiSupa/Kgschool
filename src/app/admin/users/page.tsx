'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.users'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

export default function AdminUsersPage() {
  const { t } = useI18n()

  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<
    Array<{ id: string; full_name?: string | null; email?: string | null; role?: string | null; created_at: string }>
  >([])
  const [selectedRole, setSelectedRole] = useState('')

  const roles = ['', 'admin', 'teacher', 'parent', 'kitchen', 'support']

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const kitaId = await getActiveKitaId()
        if (!kitaId) {
          setUsers([])
          setError(t(sT('errKitaNotFound')))
          return
        }

        const tenantIds = await getProfileIdsForKita(supabase, kitaId)
        if (tenantIds.length === 0) {
          setUsers([])
          return
        }

        let query = supabase.from('profiles').select('*').in('id', tenantIds)
        if (selectedRole) {
          query = query.eq('role', selectedRole)
        }
        query = query.order('created_at', { ascending: false })

        const { data, error: err } = await query
        if (err) throw err
        setUsers((data || []) as typeof users)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t(sT('errLoadUsers')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE')
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-blue-50 text-blue-600 border-blue-100',
      teacher: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      parent: 'bg-green-50 text-green-600 border-green-100',
      kitchen: 'bg-amber-50 text-amber-600 border-amber-100',
      support: 'bg-gray-50 text-ui-muted border-gray-100'
    }
    return colors[role] || 'bg-gray-50 text-ui-muted border-gray-100'
  }

  if (loading && users.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-ui-muted font-medium max-w-2xl">{t(sT('usersListSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/users/new"
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100/80 dark:shadow-indigo-900/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
          >
            {t(sT('addNewUser'))}
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-10 flex flex-wrap gap-2">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`min-h-11 px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all duration-300 touch-manipulation ${
              selectedRole === role 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100/80 dark:shadow-indigo-900/30'
                : 'bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-white/5 dark:text-slate-200 dark:border-white/12 dark:hover:border-white/25'
            }`}
          >
            {role ? t(`roles.${role}`) : t(sT('allUsers'))}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorAlert message={error} />
      ) : users.length === 0 ? (
        <IOSCard className="p-24 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
          <div className="text-5xl opacity-20 mb-6">👤</div>
          <p className="text-slate-500 font-bold text-xl">
            {selectedRole
              ? t(sT('noUsersForRole')).replace('{{role}}', t(`roles.${selectedRole}`))
              : t(sT('noUsersSystem'))}
          </p>
          <p className="text-ui-soft mt-2 font-medium">{t(sT('tryAdjustFiltersUsers'))}</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-0 overflow-hidden shadow-xl shadow-slate-200/40 border-slate-100">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[11px] font-black text-ui-soft uppercase tracking-widest">User Profile</th>
                            <th className="px-8 py-5 text-[11px] font-black text-ui-soft uppercase tracking-widest">Role</th>
                            <th className="px-8 py-5 text-[11px] font-black text-ui-soft uppercase tracking-widest">Added On</th>
                            <th className="px-8 py-5 text-[11px] font-black text-ui-soft uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            {u.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <span className="block font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                                                {u.full_name || 'Unbekannt'}
                                            </span>
                                            <span className="text-xs font-bold text-ui-soft uppercase tracking-tight">{u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border ${getRoleBadgeColor(u.role || '')}`}>
                                        {u.role || ''}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-ui-soft font-bold uppercase tracking-tight">{formatDate(u.created_at)}</td>
                                <td className="px-8 py-6 text-right">
                                    <Link href={`/admin/users/${u.id}`} className="inline-flex px-6 py-2 bg-slate-100 hover:bg-indigo-600 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white rounded-xl transition-all shadow-sm">
                                        View Profile
                                    </Link>
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
