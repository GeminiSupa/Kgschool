'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.messages'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminMessagesPage() {
  const { t } = useI18n()

  const supabase = createClient()
  const { user } = useAuthStore()
  const { messages, loading, error, unreadCount, fetchMessages, sendMessage, inbox, outbox } = useMessagesStore()

  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox')
  const [showCompose, setShowCompose] = useState(false)
  const [profiles, setProfiles] = useState<any[]>([])
  const [composeForm, setComposeForm] = useState({ recipient_id: '', content: '' })
  const [composeLoading, setComposeLoading] = useState(false)
  const [composeError, setComposeError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const run = async () => {
      await fetchMessages(user.id, 'all')
      const kitaId = await getActiveKitaId()
      if (!kitaId) {
        setProfiles([])
        return
      }
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      const recipientIds = tenantIds.filter((tid) => tid !== user.id)
      if (recipientIds.length === 0) {
        setProfiles([])
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', recipientIds)
        .order('full_name')
      setProfiles(data || [])
    }
    void run()
  }, [user?.id, fetchMessages, supabase])

  const displayMessages = useMemo(() => {
    if (!user?.id) return []
    return activeTab === 'inbox' ? inbox(user.id) : outbox(user.id)
  }, [activeTab, messages, user?.id, inbox, outbox])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setComposeLoading(true)
    setComposeError('')
    try {
      await sendMessage({
        sender_id: user.id,
        recipient_id: composeForm.recipient_id,
        content: composeForm.content,
        attachments: []
      })
      await fetchMessages(user.id, 'all')
      setShowCompose(false)
      setComposeForm({ recipient_id: '', content: '' })
    } catch (e: any) {
      setComposeError(e.message || t(sT('errSendMessage')))
    } finally {
      setComposeLoading(false)
    }
  }

  const getProfile = (id: string) => profiles.find(p => p.id === id)
  const getName = (id: string) => getProfile(id)?.full_name || id

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-4 border-b border-black/10 dark:border-white/10">
        {(['inbox', 'outbox'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-aura-primary text-aura-primary'
                : 'border-transparent text-ui-muted hover:text-slate-900 dark:text-slate-200'
            }`}
          >
            {tab === 'inbox' ? 'Eingang' : 'Gesendet'}
            {tab === 'inbox' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
        <IOSButton onClick={() => setShowCompose(true)} size="small" className="ml-auto mb-1">
          ➕ Verfassen
        </IOSButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="mb-6"><ErrorAlert message={error.message || 'Fehler'} /></div>
      ) : (
        <IOSCard className="overflow-hidden p-0">
          {displayMessages.length === 0 ? (
            <div className="p-8 text-center text-ui-soft">
              <div className="text-5xl opacity-40 mb-4">{activeTab === 'inbox' ? '📬' : '📤'}</div>
              <p className="font-medium">
                {activeTab === 'inbox' ? 'Keine Nachrichten im Posteingang' : 'Keine gesendeten Nachrichten'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/10">
              {displayMessages.map(msg => (
                <Link key={msg.id} href={`/admin/messages/${msg.id}`}
                  className={`block p-5 hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors ${!msg.read_at && activeTab === 'inbox' ? 'bg-aura-primary/10 dark:bg-aura-primary/10' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-slate-900 dark:text-slate-50 ${!msg.read_at && activeTab === 'inbox' ? 'font-bold' : ''}`}>
                        {activeTab === 'inbox' ? getName(msg.sender_id) : getName(msg.recipient_id)}
                      </p>
                      <p className="text-sm text-ui-muted mt-1 line-clamp-1 overflow-hidden">{msg.content}</p>
                      <p className="text-xs text-ui-soft mt-1.5">{formatDateTime(msg.created_at)}</p>
                    </div>
                    {!msg.read_at && activeTab === 'inbox' && (
                      <div className="ml-4 shrink-0 w-2.5 h-2.5 bg-aura-primary rounded-full" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </IOSCard>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompose(false) }}>
          <IOSCard className="max-w-2xl w-full p-0 overflow-hidden bg-background">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-foreground">Nachricht verfassen</h3>
                <button onClick={() => setShowCompose(false)} className="text-ui-soft hover:text-foreground transition-colors">✕</button>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ui-muted mb-1">Empfänger *</label>
                  <select required value={composeForm.recipient_id}
                    onChange={e => setComposeForm({ ...composeForm, recipient_id: e.target.value })}
                    className="w-full min-h-11 px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-(--aura-primary)/25 outline-none text-foreground font-semibold">
                    <option value="">Empfänger auswählen</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ui-muted mb-1">Nachricht *</label>
                  <textarea required rows={6} value={composeForm.content}
                    onChange={e => setComposeForm({ ...composeForm, content: e.target.value })}
                    placeholder="Ihre Nachricht..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-(--aura-primary)/25 outline-none resize-none text-foreground font-medium" />
                </div>
                {composeError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{composeError}</div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <IOSButton type="button" variant="secondary" onClick={() => setShowCompose(false)}>
                    Abbrechen
                  </IOSButton>
                  <IOSButton type="submit" disabled={composeLoading}>
                    {composeLoading ? 'Wird gesendet...' : 'Senden'}
                  </IOSButton>
                </div>
              </form>
            </div>
          </IOSCard>
        </div>
      )}
    </div>
  )
}
