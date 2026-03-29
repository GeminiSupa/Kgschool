'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.users.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function NewUserPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = createClient()
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: 'parent',
    password: '',
    address: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    start_date: '',
    qualifications: '',
    weekly_hours: '',
    contract_type: ''
  })

  const [files, setFiles] = useState<{
    contract: File | null,
    health_cert: File | null,
    avatar: File | null
  }>({
    contract: null,
    health_cert: null,
    avatar: null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
        const response = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })
        
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Fehler beim Erstellen des Benutzers')
        
        const newUserId = result.user?.id
        
        // Upload Files if they exist
        if (newUserId) {
           const uploadPromises = []
           
           if (files.avatar) {
              const fileExt = files.avatar.name.split('.').pop()
              const filePath = `${newUserId}/avatar-${Date.now()}.${fileExt}`
              uploadPromises.push(
                supabase.storage.from('avatars').upload(filePath, files.avatar).then(async ({ data, error }) => {
                   if (!error && data) {
                      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
                      await supabase.from('profiles').update({ avatar_url: publicUrlData.publicUrl }).eq('id', newUserId)
                   }
                })
              )
           }
           
           if (files.contract) {
              const fileExt = files.contract.name.split('.').pop()
              const filePath = `${newUserId}/contract-${Date.now()}.${fileExt}`
              uploadPromises.push(
                supabase.storage.from('user-documents').upload(filePath, files.contract).then(async ({ data, error }) => {
                   if (!error && data) {
                      await supabase.from('user_documents').insert({ profile_id: newUserId, document_type: 'Arbeitsvertrag', file_path: data.path })
                   }
                })
              )
           }
           
           if (files.health_cert) {
              const fileExt = files.health_cert.name.split('.').pop()
              const filePath = `${newUserId}/health-${Date.now()}.${fileExt}`
              uploadPromises.push(
                supabase.storage.from('user-documents').upload(filePath, files.health_cert).then(async ({ data, error }) => {
                   if (!error && data) {
                      await supabase.from('user_documents').insert({ profile_id: newUserId, document_type: 'Gesundheitszeugnis', file_path: data.path })
                   }
                })
              )
           }
           
           await Promise.all(uploadPromises)
        }

        alert('Benutzer erfolgreich erstellt!')
        router.push('/admin/users')
    } catch (e: any) {
        setError(e.message)
    } finally {
        setSubmitting(false)
    }
  }

  const isStaff = form.role !== 'parent'

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Benutzern
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Legen Sie ein neues Konto für Personal oder Eltern an und laden Sie wichtige Dokumente hoch.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Data */}
        <IOSCard className="p-8 shadow-sm border-black/5">
            <h3 className="text-lg font-black tracking-tight text-gray-900 mb-6">🔑 Account-Daten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Vollständiger Name *</label>
                    <input type="text" value={form.full_name} onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))} required placeholder="z.B. Maria Musterfrau" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Rolle *</label>
                    <select value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as any }))} required className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all">
                        <option value="parent">Elternteil</option>
                        <option value="teacher">Pädagogische Fachkraft</option>
                        <option value="admin">Administrator</option>
                        <option value="kitchen">Hauswirtschaft/Küche</option>
                        <option value="support">Technischer Support</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Email Adresse *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required placeholder="email@beispiel.de" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Initialpasswort *</label>
                    <input type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required placeholder="Mind. 8 Zeichen" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
            </div>
        </IOSCard>

        {/* Personal Details */}
        <IOSCard className="p-8 shadow-sm border-black/5">
            <h3 className="text-lg font-black tracking-tight text-gray-900 mb-6">👤 Persönliche Daten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Adresse</label>
                    <input type="text" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Musterstraße 1, 12345 Stadt" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Geburtsdatum</label>
                    <input type="date" value={form.date_of_birth} onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
                <div>
                     {/* Empty space for layout balance */}
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Notfallkontakt Name</label>
                    <input type="text" value={form.emergency_contact_name} onChange={(e) => setForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))} placeholder="Max Mustermann" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
                <div>
                    <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Notfallkontakt Telefon</label>
                    <input type="text" value={form.emergency_contact_phone} onChange={(e) => setForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))} placeholder="0123 456789" className="w-full px-5 py-3 bg-gray-50 border border-black/5 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                </div>
            </div>
        </IOSCard>

        {/* Staff / Employment Details */}
        {isStaff && (
            <IOSCard className="p-8 shadow-sm border-black/5 bg-indigo-50/30">
                <h3 className="text-lg font-black tracking-tight text-indigo-900 mb-6">💼 Anstellungsdaten (Personal)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Vertragsbeginn</label>
                        <input type="date" value={form.start_date} onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))} className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Vertragsart</label>
                        <select value={form.contract_type} onChange={(e) => setForm(prev => ({ ...prev, contract_type: e.target.value }))} className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all">
                            <option value="">Bitte wählen...</option>
                            <option value="Vollzeit">Vollzeit</option>
                            <option value="Teilzeit">Teilzeit</option>
                            <option value="Aushilfe">Aushilfe / Minijob</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Wochenstunden</label>
                        <input type="number" value={form.weekly_hours} onChange={(e) => setForm(prev => ({ ...prev, weekly_hours: e.target.value }))} placeholder="z.B. 40" className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Qualifikationen</label>
                        <input type="text" value={form.qualifications} onChange={(e) => setForm(prev => ({ ...prev, qualifications: e.target.value }))} placeholder="Erzieher/in, Erste Hilfe etc." className="w-full px-5 py-3 bg-white border border-indigo-100 rounded-2xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all" />
                    </div>
                </div>
            </IOSCard>
        )}

        {/* Document Uploads */}
        <IOSCard className="p-8 shadow-sm border-black/5">
            <h3 className="text-lg font-black tracking-tight text-gray-900 mb-6">📄 Dokumente Hochladen</h3>
            <div className="space-y-6">
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-800">Profilbild</p>
                        <p className="text-xs text-gray-500">Empfohlen: Quadratisch, max 2MB (.jpg, .png)</p>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))} className="text-sm" />
                </div>
                
                {isStaff && (
                    <>
                        <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-800">Arbeitsvertrag (PDF)</p>
                                <p className="text-xs text-gray-500">Max 5MB</p>
                            </div>
                            <input type="file" accept="application/pdf" onChange={(e) => setFiles(prev => ({ ...prev, contract: e.target.files?.[0] || null }))} className="text-sm" />
                        </div>
                        
                        <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-800">Gesundheitszeugnis (PDF)</p>
                                <p className="text-xs text-gray-500">Max 5MB</p>
                            </div>
                            <input type="file" accept="application/pdf" onChange={(e) => setFiles(prev => ({ ...prev, health_cert: e.target.files?.[0] || null }))} className="text-sm" />
                        </div>
                    </>
                )}
            </div>
        </IOSCard>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100">
                ⚠️ {error}
            </div>
        )}

        <div className="flex gap-4 justify-end pt-4">
            <IOSButton type="button" variant="secondary" onClick={() => router.push('/admin/users')} className="px-8 py-3 font-black text-xs uppercase tracking-widest">
                Abbrechen
            </IOSButton>
            <IOSButton type="submit" disabled={submitting} className="px-12 py-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">
                {submitting ? <LoadingSpinner size="sm" /> : 'Benutzer anlegen'}
            </IOSButton>
        </div>
      </form>
    </div>
  )
}
