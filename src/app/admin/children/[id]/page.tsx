'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { ChildForm } from '@/components/forms/ChildForm'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

export default function ChildDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  
  const [child, setChild] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchChild() {
      try {
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        setChild(data)
      } catch (error) {
        console.error('Error fetching child:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchChild()
  }, [id, supabase])

  const handleUpdate = async (formData: any) => {
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('children')
        .update(formData)
        .eq('id', id)

      if (error) throw error
      alert('Profil erfolgreich aktualisiert!')
      setIsEditing(false)
      setChild({ ...child, ...formData })
    } catch (error: any) {
      alert(error.message || t(sT('errUpdateGeneric')))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t(sT('confirmDeleteChildPermanent')))) return
    try {
        const { error } = await supabase.from('children').delete().eq('id', id)
        if (error) throw error
        alert(t(sT('successChildProfileDeleted')))
        router.push('/admin/children')
    } catch (e: any) {
        alert(e.message)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!child)
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">{t(sT('errNotFoundChild'))}</div>
    )

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/children"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zur Liste
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
                <Heading size="xl" className="text-gray-900 tracking-tight">{child.first_name} {child.last_name}</Heading>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                        child.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                        child.status === 'inactive' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                        {child.status}
                    </span>
                    <span className="text-sm font-bold text-gray-400">ID: {child.id.split('-')[0]}</span>
                </div>
            </div>
            {!isEditing && (
                <div className="flex gap-2">
                     <IOSButton variant="secondary" onClick={() => setIsEditing(true)} className="px-6 py-2 text-xs font-black uppercase tracking-widest border-black/5 hover:border-[#667eea]/40">
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
        <div className="lg:col-span-2">
            <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5 border-black/5 h-full">
                {isEditing ? (
                    <div className="animate-in fade-in duration-500">
                        <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-8 border-b border-black/5 pb-4">Profil Bearbeiten</h3>
                        <ChildForm
                            child={child}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            loading={submitting}
                        />
                    </div>
                ) : (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div>
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">Stammdaten</p>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Vorname</p>
                                    <p className="text-base font-black text-gray-900">{child.first_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Nachname</p>
                                    <p className="text-base font-black text-gray-900">{child.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Geburtsdatum</p>
                                    <p className="text-base font-black text-gray-900">{new Date(child.date_of_birth).toLocaleDateString('de-DE')}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Einschulung</p>
                                    <p className="text-base font-black text-gray-900">{new Date(child.enrollment_date).toLocaleDateString('de-DE')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-black/5">
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">Verwaltung</p>
                            <div className="p-6 bg-[#f2f2f7] rounded-3xl border border-black/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Gruppenzuordnung</p>
                                    <p className="text-lg font-black text-[#667eea]">{child.group_id || 'Nicht zugewiesen'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 mb-1">Zuletzt aktualisiert</p>
                                    <p className="text-xs font-black text-gray-900">{new Date(child.updated_at).toLocaleDateString('de-DE')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </IOSCard>
        </div>

        <div className="space-y-8">
            <IOSCard className="p-8 border-black/5 shadow-sm">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Elternkontakte</h3>
                {child.parent_ids && child.parent_ids.length > 0 ? (
                    <div className="space-y-4">
                        {child.parent_ids.map((pid: string) => (
                            <div key={pid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-black/5">
                                <div className="w-8 h-8 rounded-full bg-[#667eea]/10 text-[#667eea] flex items-center justify-center text-[10px] font-black">👤</div>
                                <div className="flex-1 truncate">
                                    <p className="text-xs font-black text-gray-800 truncate">ID: {pid.split('-')[0]}</p>
                                    <Link href={`/admin/users/${pid}`} className="text-[9px] font-black uppercase text-[#667eea] hover:underline transition-all">Profil ansehen</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-red-500 font-bold">Keine Eltern verknüpft!</p>
                )}
            </IOSCard>

            <IOSCard className="p-8 border-black/5 shadow-sm bg-blue-50/20">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">Schnellzugriff</h3>
                <div className="space-y-2">
                     <Link href={`/admin/attendance?child=${child.id}`} className="block w-full p-4 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#667eea] hover:scale-[1.02] transition-transform shadow-sm">📊 Anwesenheitshistorie</Link>
                     <Link href={`/admin/fees?child=${child.id}`} className="block w-full p-4 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#667eea] hover:scale-[1.02] transition-transform shadow-sm">💰 Gebührenkonto</Link>
                </div>
            </IOSCard>
        </div>
      </div>
    </div>
  )
}
