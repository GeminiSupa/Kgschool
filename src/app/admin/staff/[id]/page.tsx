'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useStaffStore } from '@/stores/staff'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { StaffForm } from '@/components/forms/StaffForm'
import { createClient } from '@/utils/supabase/client'

export default function StaffDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { fetchStaffById } = useStaffStore()
  const supabase = createClient()
  
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      const data = await fetchStaffById(id as string)
      setMember(data)
      setLoading(false)
    }
    if (id) loadData()
  }, [id, fetchStaffById])

  const handleUpdate = async (formData: any) => {
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            avatar_url: formData.avatar_url
        })
        .eq('id', id)

      if (error) throw error
      alert('Profil erfolgreich aktualisiert!')
      setIsEditing(false)
      const data = await fetchStaffById(id as string)
      setMember(data)
    } catch (error: any) {
      alert(error.message || 'Fehler beim Aktualisieren')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!member) return <div className="max-w-4xl mx-auto py-12 text-center text-gray-500">Mitarbeiter nicht gefunden.</div>

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/staff"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zum Personal
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
                <Heading size="xl" className="text-gray-900 tracking-tight">{member.full_name}</Heading>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                        member.role === 'teacher' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        member.role === 'kitchen' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        {member.role === 'teacher' ? 'Erzieher' : member.role === 'kitchen' ? 'Küche' : 'Administrator'}
                    </span>
                    <span className="text-sm font-bold text-gray-400">Personal-E-Mail: {member.email}</span>
                </div>
            </div>
            {!isEditing && (
                <IOSButton variant="secondary" onClick={() => setIsEditing(true)} className="px-6 py-2 text-xs font-black uppercase tracking-widest">
                    Profil Bearbeiten
                </IOSButton>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <IOSCard className="p-10 shadow-2xl shadow-indigo-900/5 border-black/5">
                {isEditing ? (
                    <div className="animate-in fade-in duration-500">
                        <h3 className="text-xs font-black text-black/30 uppercase tracking-widest mb-8 border-b border-black/5 pb-4">Profil Bearbeiten</h3>
                        <StaffForm
                            staff={member}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            loading={submitting}
                        />
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        <div className="flex items-center gap-8 pb-10 border-b border-black/5 mb-10">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-xl">
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-indigo-50 text-indigo-200">
                                        👤
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Mitarbeiter Profil</p>
                                <h2 className="text-2xl font-black text-gray-900">{member.full_name}</h2>
                                <p className="text-sm font-bold text-gray-400 mt-1">{member.email}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Persönliche Informationen</p>
                            <div className="grid grid-cols-2 gap-8 text-left">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Voller Name</p>
                                    <p className="text-base font-black text-gray-900">{member.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">E-Mail Adresse</p>
                                    <p className="text-base font-black text-gray-900">{member.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Telefonnummer</p>
                                    <p className="text-base font-black text-gray-900">{member.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">Mitglied seit</p>
                                    <p className="text-base font-black text-gray-900">{new Date(member.created_at).toLocaleDateString('de-DE')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-black/5">
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Qualifikationen & Dokumente</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-black/5 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                                    <span className="text-xs font-black text-gray-700">Arbeitsvertrag.pdf</span>
                                    <span className="text-[10px] font-black text-[#667eea] opacity-0 group-hover:opacity-100 transition-opacity">ÖFFNEN</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-black/5 flex items-center justify-between group cursor-pointer hover:bg-white transition-all">
                                    <span className="text-xs font-black text-gray-700">Gesundheitszeugnis.pdf</span>
                                    <span className="text-[10px] font-black text-[#667eea] opacity-0 group-hover:opacity-100 transition-opacity">ÖFFNEN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </IOSCard>
        </div>

        <div className="space-y-8">
            <IOSCard className="p-8 border-black/5 shadow-sm">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Gruppenzuweisung</h3>
                <p className="text-xs text-gray-400 italic mb-6">Dieser Mitarbeiter ist aktuell den folgenden Gruppen zugewiesen:</p>
                <div className="space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        Bärengruppe (U3)
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-black/5">
                    <Link href="/admin/groups" className="text-[10px] font-black text-[#667eea] uppercase tracking-widest hover:underline">Zuweisung bearbeiten →</Link>
                </div>
            </IOSCard>

            <IOSCard className="p-8 border-black/5 shadow-sm bg-black text-white">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">HR Status</h3>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-black uppercase tracking-widest">Aktiv angestellt</span>
                </div>
                <p className="text-[10px] text-white/40 mt-4 leading-relaxed font-bold italic">Nächste Gehaltsabrechnung am 30. {new Date().toLocaleString('de-DE', { month: 'long' })}</p>
            </IOSCard>
        </div>
      </div>
    </div>
  )
}
