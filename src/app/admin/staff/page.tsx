'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.staff'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStaffStore } from '@/stores/staff'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminStaffPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { staff, loading, error, fetchStaff } = useStaffStore()
  const [selectedRole, setSelectedRole] = useState('')

  const roles = [
    { value: '', label: 'Alle' },
    { value: 'teacher', label: 'Erzieher' },
    { value: 'kitchen', label: 'Küche' },
    { value: 'support', label: 'Support' }
  ]

  useEffect(() => {
    fetchStaff(selectedRole || undefined)
  }, [selectedRole, fetchStaff])

  const getRoleLabel = (role: string) => {
    const r = roles.find(r => r.value === role)
    return r ? r.label : role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      teacher: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      kitchen: 'bg-amber-50 text-amber-600 border-amber-100',
      support: 'bg-green-50 text-green-600 border-green-100',
      admin: 'bg-blue-50 text-blue-600 border-blue-100'
    }
    return colors[role] || 'bg-gray-50 text-ui-muted border-gray-100'
  }

  if (loading && staff.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Ihre Mitarbeiter, Profile und Qualifikationen.</p>
        </div>
        <Link href="/admin/staff/new">
          <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20">
            <span>➕</span>
            <span>Mitarbeiter hinzufügen</span>
          </IOSButton>
        </Link>
      </div>

      <div className="mb-10 overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex gap-2">
            {roles.map(role => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  selectedRole === role.value
                    ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                    : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden des Personals'} />
      ) : staff.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">👥</div>
          <p className="text-ui-soft font-bold max-w-xs mx-auto">
            {selectedRole ? `Keine Mitarbeiter mit der Rolle "${getRoleLabel(selectedRole)}" gefunden.` : 'Keine Mitarbeiter im System gefunden.'}
          </p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {staff.map(member => (
                <Link key={member.id} href={`/admin/staff/${member.id}`}>
                    <IOSCard className="p-0 overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border-black/5 h-full flex flex-col">
                        <div className="p-8 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-black/5 group-hover:bg-[#667eea] group-hover:text-white flex items-center justify-center text-xl font-black text-black/20 shadow-inner transition-all duration-500">
                                    {member.full_name?.charAt(0) || '?'}
                                </div>
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${getRoleBadgeColor(member.role)}`}>
                                    {member.role}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-1 group-hover:text-[#667eea] transition-colors">{member.full_name}</h3>
                            <p className="text-xs font-bold text-ui-soft truncate mb-6">{member.email}</p>
                            
                            <div className="flex items-center gap-2 text-[10px] font-black text-black/20 uppercase tracking-widest italic">
                                <span>📱</span>
                                <span className="group-hover:text-slate-800 dark:text-slate-100 transition-colors">{member.phone || 'Keine Nummer'}</span>
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gray-50/50 border-t border-black/5 transition-colors group-hover:bg-white flex items-center justify-between">
                            <span className="text-[10px] font-black text-[#667eea] uppercase tracking-widest group-hover:translate-x-1 transition-all duration-500">Profil ansehen →</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 shadow-sm border border-black/5 transition-all">✏️</div>
                        </div>
                    </IOSCard>
                </Link>
            ))}
        </div>
      )}
    </div>
  )
}
