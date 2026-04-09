'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.users.id'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { sT } from '@/i18n/sT'

export default function EditUserPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    role: '',
    active: true,
    address: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    avatar_url: ''
  })

  const [employment, setEmployment] = useState({
    start_date: '',
    qualifications: '',
    weekly_hours: '',
    contract_type: ''
  })

  const [documents, setDocuments] = useState<any[]>([])

  const [files, setFiles] = useState<{
    contract: File | null,
    health_cert: File | null,
    avatar: File | null
  }>({
    contract: null,
    health_cert: null,
    avatar: null
  })

  const fetchUser = async () => {
    try {
        const uid = String(id)
        const kitaId = await getActiveKitaId()
        if (!kitaId) {
          setError(t(sT('errKitaNotFound')))
          return
        }
        const tenantIds = await getProfileIdsForKita(supabase, kitaId)
        if (!tenantIds.includes(uid)) {
          setError(t(sT('errAccessDeniedGroup')))
          router.replace('/admin/users')
          return
        }

        const { data, error: err } = await supabase
          .from('profiles')
          .select('*, employment_details(*), user_documents(*)')
          .eq('id', id)
          .single()
        
        if (err) throw err

        setForm({
          email: data.email || '',
          full_name: data.full_name || '',
          role: data.role || '',
          active: data.active !== false,
          address: data.address || '',
          date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          avatar_url: data.avatar_url || ''
        })

        if (data.employment_details && data.employment_details.length > 0) {
            const emp = data.employment_details[0]
            setEmployment({
                start_date: emp.start_date || '',
                qualifications: emp.qualifications || '',
                weekly_hours: emp.weekly_hours?.toString() || '',
                contract_type: emp.contract_type || ''
            })
        }

        if (data.user_documents) {
            setDocuments(data.user_documents)
        }

    } catch (e: any) {
        setError(e.message)
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchUser()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
        // 1. Update Profile
        const { error: err } = await supabase
            .from('profiles')
            .update({
                full_name: form.full_name,
                role: form.role,
                active: form.active,
                address: form.address,
                date_of_birth: form.date_of_birth || null,
                emergency_contact_name: form.emergency_contact_name,
                emergency_contact_phone: form.emergency_contact_phone
            })
            .eq('id', id)
        
        if (err) throw err
        
        // 2. Update Employment Details (if staff)
        if (form.role !== 'parent') {
            const { data: existingEmp } = await supabase.from('employment_details').select('id').eq('profile_id', id).single()
            if (existingEmp) {
                await supabase.from('employment_details').update({
                    start_date: employment.start_date || null,
                    qualifications: employment.qualifications,
                    weekly_hours: employment.weekly_hours ? parseInt(employment.weekly_hours) : null,
                    contract_type: employment.contract_type
                }).eq('profile_id', id)
            } else {
                await supabase.from('employment_details').insert({
                    profile_id: id,
                    start_date: employment.start_date || null,
                    qualifications: employment.qualifications,
                    weekly_hours: employment.weekly_hours ? parseInt(employment.weekly_hours) : null,
                    contract_type: employment.contract_type
                })
            }
        }

        // 3. Upload new files if provided
        const uploadPromises = []
           
        if (files.avatar) {
           const fileExt = files.avatar.name.split('.').pop()
           const filePath = `${id}/avatar-${Date.now()}.${fileExt}`
           uploadPromises.push(
             supabase.storage.from('avatars').upload(filePath, files.avatar).then(async ({ data, error }) => {
                if (!error && data) {
                   const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
                   await supabase.from('profiles').update({ avatar_url: publicUrlData.publicUrl }).eq('id', id)
                }
             })
           )
        }
        
        if (files.contract) {
           const fileExt = files.contract.name.split('.').pop()
           const filePath = `${id}/contract-${Date.now()}.${fileExt}`
           uploadPromises.push(
             supabase.storage.from('user-documents').upload(filePath, files.contract).then(async ({ data, error }) => {
                if (!error && data) {
                   await supabase.from('user_documents').insert({ profile_id: id, document_type: 'Arbeitsvertrag', file_path: data.path })
                }
             })
           )
        }
        
        if (files.health_cert) {
           const fileExt = files.health_cert.name.split('.').pop()
           const filePath = `${id}/health-${Date.now()}.${fileExt}`
           uploadPromises.push(
             supabase.storage.from('user-documents').upload(filePath, files.health_cert).then(async ({ data, error }) => {
                if (!error && data) {
                   await supabase.from('user_documents').insert({ profile_id: id, document_type: 'Gesundheitszeugnis', file_path: data.path })
                }
             })
           )
        }
        
        await Promise.all(uploadPromises)

        alert(t(sT('successUserUpdated')))
        await fetchUser() // Reload data
        setFiles({ contract: null, health_cert: null, avatar: null }) // Reset files
    } catch (e: any) {
        setError(e.message)
    } finally {
        setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t(sT('confirmDeactivateUser')))) return
    try {
        await supabase.from('profiles').update({ active: false }).eq('id', id)
        alert(t(sT('successUserDeactivated')))
        router.push('/admin/users')
    } catch (e: any) {
        alert(e.message)
    }
  }

  const viewDocument = async (filePath: string) => {
      try {
          const { data, error } = await supabase.storage.from('user-documents').createSignedUrl(filePath, 60)
          if (error) throw error
          if (data?.signedUrl) {
              window.open(data.signedUrl, '_blank')
          }
      } catch (err) {
          alert(t(sT('errDocumentOpen')))
      }
  }

  const deleteDocument = async (docId: string, filePath: string) => {
      if (!confirm(t(sT('confirmDeleteDocument')))) return
      try {
          await supabase.storage.from('user-documents').remove([filePath])
          await supabase.from('user_documents').delete().eq('id', docId)
          setDocuments(prev => prev.filter(d => d.id !== docId))
      } catch (err) {
          alert(t(sT('errDeleteDocument')))
      }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  const isStaff = form.role !== 'parent'

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-aura-primary mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Benutzern
        </Link>
        <div className="flex items-center gap-4 mt-2">
            {form.avatar_url && (
                <img src={form.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
            )}
            <div>
                <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))} - {form.full_name}</Heading>
                <p className="text-sm text-ui-soft mt-1">Passen Sie die Informationen und Zugriffsrechte dieses Benutzers an.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
            <IOSCard className="p-8 shadow-sm border-black/5">
                <form id="edit-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Core Info */}
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 mb-6">🔑 Account-Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Vollständiger Name</label>
                                <input type="text" value={form.full_name} onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))} required className="ui-input font-bold bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Rolle</label>
                                <select value={form.role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))} required className="ui-select bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10">
                                    <option value="parent">Elternteil</option>
                                    <option value="teacher">Pädagogische Fachkraft</option>
                                    <option value="admin">Administrator</option>
                                    <option value="kitchen">Hauswirtschaft/Küche</option>
                                    <option value="support">Technischer Support</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Email Adresse (Nicht änderbar)</label>
                                <input type="email" value={form.email} disabled className="w-full px-5 py-3 bg-gray-100 border border-black/5 rounded-2xl text-sm font-bold text-ui-soft cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* Personal Info */}
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 mb-6">👤 Persönliche Daten</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Adresse</label>
                                <input type="text" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="ui-input font-bold bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Geburtsdatum</label>
                                <input type="date" value={form.date_of_birth} onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))} className="ui-input font-bold bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10" />
                            </div>
                            <div></div>
                            <div>
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Notfallkontakt Name</label>
                                <input type="text" value={form.emergency_contact_name} onChange={(e) => setForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))} className="ui-input font-bold bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Notfallkontakt Telefon</label>
                                <input type="text" value={form.emergency_contact_phone} onChange={(e) => setForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))} className="ui-input font-bold bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/10" />
                            </div>
                        </div>
                    </div>

                    {/* Staff Info */}
                    {isStaff && (
                        <>
                            <hr className="border-black/5" />
                            <div>
                                <h3 className="text-lg font-black tracking-tight text-indigo-900 mb-6">💼 Anstellungsdaten</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100">
                                    <div>
                                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Vertragsbeginn</label>
                                        <input type="date" value={employment.start_date} onChange={(e) => setEmployment(prev => ({ ...prev, start_date: e.target.value }))} className="ui-input font-bold bg-white dark:bg-white/5 border-indigo-100 dark:border-white/10" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Vertragsart</label>
                                        <select value={employment.contract_type} onChange={(e) => setEmployment(prev => ({ ...prev, contract_type: e.target.value }))} className="ui-select bg-white dark:bg-white/5 border-indigo-100 dark:border-white/10">
                                            <option value="">Bitte wählen...</option>
                                            <option value="Vollzeit">Vollzeit</option>
                                            <option value="Teilzeit">Teilzeit</option>
                                            <option value="Aushilfe">Aushilfe / Minijob</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Wochenstunden</label>
                                        <input type="number" value={employment.weekly_hours} onChange={(e) => setEmployment(prev => ({ ...prev, weekly_hours: e.target.value }))} className="ui-input font-bold bg-white dark:bg-white/5 border-indigo-100 dark:border-white/10" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-indigo-900/40 uppercase tracking-widest mb-1.5 ml-1">Qualifikationen</label>
                                        <input type="text" value={employment.qualifications} onChange={(e) => setEmployment(prev => ({ ...prev, qualifications: e.target.value }))} className="ui-input font-bold bg-white dark:bg-white/5 border-indigo-100 dark:border-white/10" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 mt-8">
                        <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-aura-primary focus:ring-(--aura-primary)/25" />
                        <label htmlFor="active" className="text-sm font-bold text-slate-700 dark:text-slate-200">Account ist aktiv</label>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100">
                           ⚠️ {error}
                        </div>
                    )}
                </form>
            </IOSCard>

            {/* Document Management Section */}
            <IOSCard className="p-8 shadow-sm border-black/5">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50 mb-6">📄 Dokumente</h3>
                
                {/* Existing Documents List */}
                {documents.length > 0 && (
                    <div className="mb-8 space-y-3">
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Gespeicherte Dateien</p>
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-black/5 bg-gray-50">
                                <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{doc.document_type}</p>
                                    <p className="text-[10px] text-ui-soft mt-0.5">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => viewDocument(doc.file_path)} type="button" className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100">
                                        Ansehen
                                    </button>
                                    <button onClick={() => deleteDocument(doc.id, doc.file_path)} type="button" className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100">
                                        Löschen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload New Documents */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Neue Dokumente hochladen</p>
                    <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Neues Profilbild</p>
                            <p className="text-[10px] text-ui-soft">Ersetzt das alte Bild</p>
                        </div>
                        <input type="file" accept="image/*" onChange={(e) => setFiles(prev => ({ ...prev, avatar: e.target.files?.[0] || null }))} className="text-xs" />
                    </div>
                    {isStaff && (
                        <>
                            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Neuer Arbeitsvertrag</p>
                                </div>
                                <input type="file" accept="application/pdf" onChange={(e) => setFiles(prev => ({ ...prev, contract: e.target.files?.[0] || null }))} className="text-xs" />
                            </div>
                            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Neues Gesundheitszeugnis</p>
                                </div>
                                <input type="file" accept="application/pdf" onChange={(e) => setFiles(prev => ({ ...prev, health_cert: e.target.files?.[0] || null }))} className="text-xs" />
                            </div>
                        </>
                    )}
                </div>
            </IOSCard>

            <div className="flex gap-4 justify-end">
                <IOSButton form="edit-form" type="submit" disabled={submitting} className="px-12 py-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20">
                    {submitting ? <LoadingSpinner size="sm" /> : 'Änderungen speichern'}
                </IOSButton>
            </div>
        </div>

        <div className="space-y-6">
            <IOSCard className="p-6 border-black/5 shadow-sm">
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Status</h3>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${form.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">{form.active ? 'Aktiv' : 'Deaktiviert'}</span>
                </div>
            </IOSCard>

            <IOSCard className="p-6 border-red-50 shadow-sm">
                <h3 className="text-[10px] font-black text-red-900/30 uppercase tracking-widest mb-6">Gefahrenzone</h3>
                <button
                    onClick={handleDelete}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-colors"
                >
                    Benutzer deaktivieren
                </button>
            </IOSCard>
        </div>
      </div>
    </div>
  )
}
