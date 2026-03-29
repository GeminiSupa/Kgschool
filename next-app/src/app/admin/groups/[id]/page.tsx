'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { GroupForm } from '@/components/forms/GroupForm'
import { useChildrenStore } from '@/stores/children'

export default function GroupDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { groups, fetchGroups, updateGroup, deleteGroup, fetchGroupTeachers } = useGroupsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [group, setGroup] = useState<any>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([fetchGroups(), fetchChildren()])
        const t = await fetchGroupTeachers(id as string)
        setTeachers(t || [])
      } catch (e) {
        console.error('Error loading group data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (groups.length > 0 && id) {
      setGroup(groups.find(g => g.id === id))
    }
  }, [groups, id])

  const handleUpdate = async (formData: any) => {
    setSubmitting(true)
    try {
      await updateGroup(id as string, formData)
      alert('Gruppe erfolgreich aktualisiert!')
      setIsEditing(false)
      fetchGroups()
    } catch (error: any) {
      alert(error.message || 'Fehler beim Aktualisieren')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Gruppe wirklich löschen? Alle Kind-Beziehungen werden aufgehoben.')) return
    try {
        await deleteGroup(id as string)
        router.push('/admin/groups')
    } catch (e: any) {
        alert(e.message)
    }
  }

  const groupChildren = children.filter(c => c.group_id === id)

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!group) return <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">Gruppe nicht gefunden.</div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/admin/groups" className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform">
          ← Zurück zu Gruppen
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
                <Heading size="xl" className="text-gray-900 tracking-tight">{group.name}</Heading>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                        group.age_range.includes('U3') ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                        {group.age_range} Bereich
                    </span>
                    <span className="text-sm font-bold text-gray-400">{groupChildren.length} / {group.capacity} Kinder</span>
                </div>
            </div>
            {!isEditing && (
                <div className="flex gap-2">
                     <IOSButton variant="secondary" onClick={() => setIsEditing(true)} className="px-6 py-2 text-xs font-black uppercase tracking-widest">
                        Bearbeiten
                     </IOSButton>
                     <IOSButton variant="secondary" onClick={handleDelete} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-red-500 border-red-50 hover:border-red-100">
                        Löschen
                     </IOSButton>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {isEditing ? (
                <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5 border-black/5">
                    <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-8 border-b border-black/5 pb-4">Gruppe Bearbeiten</h3>
                    <GroupForm
                        group={group}
                        onSubmit={handleUpdate}
                        onCancel={() => setIsEditing(false)}
                        loading={submitting}
                    />
                </IOSCard>
            ) : (
                <IOSCard className="p-8 border-black/5 shadow-sm">
                    <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-8 border-b border-black/5 pb-4">Zugewiesene Kinder</h3>
                    {groupChildren.length === 0 ? (
                        <p className="text-center py-10 text-gray-400 font-bold italic">Keine Kinder in dieser Gruppe.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupChildren.map(child => (
                                <Link key={child.id} href={`/admin/children/${child.id}`}>
                                    <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-black/5 hover:border-[#667eea]/30 transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-black text-gray-300 shadow-sm border border-black/5 group-hover:text-[#667eea]">👶</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-800">{child.first_name} {child.last_name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aktiv</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </IOSCard>
            )}
        </div>

        <div className="space-y-8">
            <IOSCard className="p-8 border-black/5 shadow-sm">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-8 border-b border-black/5 pb-4">Personal / Lehrer</h3>
                {teachers.length === 0 ? (
                    <p className="text-xs text-amber-600 font-bold italic">Kein Personal zugewiesen.</p>
                ) : (
                    <div className="space-y-4">
                        {teachers.map(t => (
                            <div key={t.id} className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-[#667eea]">👤</div>
                                <div>
                                    <p className="text-xs font-black text-blue-900">{t.full_name}</p>
                                    <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">{t.role === 'primary' ? 'Leitung' : 'Zweitkraft'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-8 pt-6 border-t border-black/5">
                    <IOSButton variant="secondary" className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 border-none transition-all">Personal verwalten</IOSButton>
                </div>
            </IOSCard>

            <Link href={`/admin/groups/${id}/timetable`} className="block">
                <IOSCard className="p-8 border-indigo-100 bg-indigo-50/20 hover:bg-white hover:border-indigo-600 transition-all group shadow-none">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black text-indigo-700/40 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Stundenplan / Timetable</h3>
                        <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500">Configure active and billable days for this group.</p>
                </IOSCard>
            </Link>

            <IOSCard className="p-8 border-black/5 shadow-sm bg-[#111] text-white">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Hinweis</h3>
                <p className="text-xs font-bold leading-relaxed text-white/70 italic">Änderungen an der Kapazität können die Gruppenauslastung im Finanzmodul sowie die Empfehlungslogik bei der Anmeldung beeinflussen.</p>
            </IOSCard>
        </div>
      </div>
    </div>
  )
}
