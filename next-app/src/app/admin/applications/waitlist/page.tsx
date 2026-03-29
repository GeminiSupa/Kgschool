'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.applications.waitlist'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApplicationsStore, WaitlistEntry } from '@/stores/applications'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminWaitlistPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { waitlist, applications, loading, error, fetchWaitlist, fetchApplications, updateWaitlistPriority, updateWaitlistPosition, removeFromWaitlist } = useApplicationsStore()
  
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null)
  const [newPriority, setNewPriority] = useState(0)

  useEffect(() => {
    fetchWaitlist()
    fetchApplications('waitlist')
  }, [fetchWaitlist, fetchApplications])

  const getApplication = (applicationId: string) => {
    return applications.find(a => a.id === applicationId)
  }

  const handlePriorityUpdate = async (id: string) => {
    try {
        await updateWaitlistPriority(id, newPriority)
        setEditingPriorityId(null)
    } catch (e: any) {
        alert(e.message || 'Fehler beim Aktualisieren')
    }
  }

  const movePosition = async (id: string, currentPos: number, direction: 'up' | 'down') => {
    const list = [...waitlist].sort((a, b) => a.position - b.position)
    const index = list.findIndex(w => w.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= list.length) return

    const other = list[newIndex]
    
    try {
        await Promise.all([
            updateWaitlistPosition(id, other.position),
            updateWaitlistPosition(other.id, currentPos)
        ])
        fetchWaitlist()
    } catch (e) {
        console.error('Error swapping positions:', e)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Soll dieser Eintrag wirklich von der Warteliste entfernt werden?')) return
    try {
        await removeFromWaitlist(id)
    } catch (e: any) {
        alert(e.message)
    }
  }

  if (loading && waitlist.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <Link
          href="/admin/applications"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Anmeldungen
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Verwalten Sie Prioritäten und Positionen für die Platzvergabe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <IOSCard className="p-6 bg-white border-black/5 shadow-sm">
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Einträge Gesamt</p>
                <p className="text-2xl font-black text-gray-900">{waitlist.length}</p>
            </IOSCard>
            <IOSCard className="p-6 bg-indigo-50/50 border-indigo-100 shadow-sm">
                <p className="text-[10px] font-black text-indigo-700/40 uppercase tracking-widest mb-1">Nächste Position</p>
                <p className="text-2xl font-black text-indigo-700">#{waitlist.length + 1}</p>
            </IOSCard>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Warteliste'} />
      ) : waitlist.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">📉</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Die Warteliste ist aktuell leer.</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-0 overflow-hidden shadow-sm border-black/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Pos.</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Kind</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Startwunsch</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Priorität</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {waitlist.sort((a,b) => a.position - b.position).map((entry, idx) => {
                            const app = getApplication(entry.application_id)
                            return (
                                <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black italic shadow-lg shadow-black/20">{entry.position}</span>
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => movePosition(entry.id, entry.position, 'up')} className="text-[10px] hover:text-[#667eea] font-black">↑</button>
                                                <button onClick={() => movePosition(entry.id, entry.position, 'down')} className="text-[10px] hover:text-[#667eea] font-black">↓</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {app ? (
                                            <div>
                                                <p className="text-sm font-black text-gray-900 leading-tight">{app.child_first_name} {app.child_last_name}</p>
                                                <p className="text-[10px] font-bold text-gray-400">DOB: {new Date(app.child_date_of_birth).toLocaleDateString()}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-red-400 font-bold italic">Unbekannte Anmeldung</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-xs font-black text-gray-800">
                                        {app ? new Date(app.preferred_start_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-5">
                                        {editingPriorityId === entry.id ? (
                                            <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                                <input
                                                    type="number"
                                                    value={newPriority}
                                                    onChange={(e) => setNewPriority(parseInt(e.target.value))}
                                                    className="w-16 px-2 py-1 bg-white border border-black/5 rounded-lg text-xs font-black"
                                                />
                                                <button onClick={() => handlePriorityUpdate(entry.id)} className="text-[10px] font-black uppercase text-green-600">✓</button>
                                                <button onClick={() => setEditingPriorityId(null)} className="text-[10px] font-black uppercase text-red-400">⨯</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-indigo-600">{entry.priority_score}</span>
                                                <button onClick={() => { setEditingPriorityId(entry.id); setNewPriority(entry.priority_score); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">✏️</button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            <Link href={`/admin/applications/${entry.application_id}`} className="p-2 hover:bg-black/5 rounded-lg transition-colors" title="Anmeldung ansehen">👁️</Link>
                                            <button onClick={() => handleRemove(entry.id)} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors" title="Entfernen">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </IOSCard>
      )}
    </div>
  )
}
