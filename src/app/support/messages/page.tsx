'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { useAuth } from '@/hooks/useAuth'
import { useMessagesStore, type Message } from '@/stores/messages'
import type { Profile } from '@/stores/auth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function SupportMessagesPage() {
  const { user } = useAuth()
  const { messages, loading, error, unreadCount, fetchMessages, sendMessage, markAsRead } = useMessagesStore()

  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox')
  const [showCompose, setShowCompose] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)

  const [composeForm, setComposeForm] = useState({ recipient_id: '', content: '' })
  const [composing, setComposing] = useState(false)
  const [composeError, setComposeError] = useState('')

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      await fetchMessages(user.id, 'all')
      await fetchProfiles()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const fetchProfiles = async () => {
    try {
      setProfilesLoading(true)
      const kitaId = await getActiveKitaId()
      if (!kitaId) {
        setProfiles([])
        return
      }
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      if (tenantIds.length === 0) {
        setProfiles([])
        return
      }
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', tenantIds)
        .in('role', ['parent', 'teacher', 'admin', 'kitchen', 'support'])
        .order('full_name')

      if (fetchErr) throw fetchErr
      setProfiles((data || []) as Profile[])
    } catch (e) {
      console.error('Error fetching profiles:', e)
    } finally {
      setProfilesLoading(false)
    }
  }

  const displayMessages = useMemo(() => {
    if (!user?.id) return []
    if (activeTab === 'inbox') {
      return messages.filter((m) => m.recipient_id === user.id)
    }
    return messages.filter((m) => m.sender_id === user.id)
  }, [messages, activeTab, user?.id])

  const getPartnerName = (message: Message) => {
    if (!user?.id) return ''
    return activeTab === 'inbox'
      ? profiles.find((p) => p.id === message.sender_id)?.full_name || message.sender_id
      : profiles.find((p) => p.id === message.recipient_id)?.full_name || message.recipient_id
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    if (!composeForm.recipient_id || !composeForm.content.trim()) return

    setComposing(true)
    setComposeError('')
    try {
      await sendMessage({
        sender_id: user.id,
        recipient_id: composeForm.recipient_id,
        content: composeForm.content.trim(),
      })

      await fetchMessages(user.id, 'all')
      setShowCompose(false)
      setComposeForm({ recipient_id: '', content: '' })
    } catch (e: unknown) {
      setComposeError(e instanceof Error ? e.message : 'Failed to send message')
    } finally {
      setComposing(false)
    }
  }

  const handleMarkAsRead = async (messageId: string, isRead: boolean) => {
    if (activeTab === 'inbox' && !isRead) {
      try {
        await markAsRead(messageId)
      } catch (e) {
        console.error('Error marking as read:', e)
      }
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">
            Nachrichten
          </Heading>
          <p className="text-sm text-ui-soft mt-1">Austausch mit Eltern, der Leitung und Support.</p>
        </div>

        <IOSButton
          variant="primary"
          onClick={() => setShowCompose(true)}
          className="px-6 py-2.5 text-sm font-bold flex items-center gap-2"
        >
          <span>✍️</span>
          <span>Neue Nachricht</span>
        </IOSButton>
      </div>

      <div className="mb-6 flex w-fit gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
            activeTab === 'inbox'
              ? 'bg-white dark:bg-white/10 text-aura-primary shadow-sm'
              : 'text-ui-soft hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          Posteingang
          {unreadCount > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outbox')}
          className={`min-h-11 rounded-xl px-6 py-2 text-sm font-bold transition-all duration-300 ${
            activeTab === 'outbox'
              ? 'bg-white dark:bg-white/10 text-aura-primary shadow-sm'
              : 'text-ui-soft hover:text-slate-800 dark:hover:text-slate-100'
          }`}
        >
          Gesendet
        </button>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Nachrichten'} />
      ) : displayMessages.length === 0 ? (
        <IOSCard className="bg-slate-50/80 p-16 text-center dark:bg-white/5">
          <div className="text-5xl opacity-40 mb-4">💬</div>
          <p className="text-ui-soft font-medium">
            {activeTab === 'inbox' ? 'Keine Nachrichten empfangen.' : 'Keine Nachrichten gesendet.'}
          </p>
        </IOSCard>
      ) : (
        <div className="grid gap-3">
          {displayMessages.map((message) => (
            <IOSCard
              key={message.id}
              onClick={() => handleMarkAsRead(message.id, !!message.read_at)}
              className={`group cursor-pointer overflow-hidden border-border p-0 transition-all duration-300 hover:border-aura-primary/30 ${
                activeTab === 'inbox' && !message.read_at ? 'bg-aura-primary/10 dark:bg-aura-primary/10' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-slate-900 dark:text-slate-50 group-hover:text-aura-primary transition-colors">
                        {getPartnerName(message)}
                      </h4>
                      {activeTab === 'inbox' && !message.read_at && (
                        <span className="px-2 py-0.5 bg-aura-primary text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                          Neu
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-ui-muted line-clamp-2 leading-relaxed">{message.content}</p>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-ui-soft">{formatDate(message.created_at)}</p>
                  </div>
                  <div className="text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400 pt-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}

      {showCompose && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <IOSCard className="max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-8">
              <Heading size="md" className="text-slate-900 dark:text-slate-50">
                Nachricht verfassen
              </Heading>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                aria-label="Close"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ui-soft transition-colors hover:text-ui-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:focus-visible:ring-indigo-500/40"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-ui-soft">
                  Empfänger *
                </label>
                <select
                  value={composeForm.recipient_id}
                  onChange={(e) => setComposeForm((p) => ({ ...p, recipient_id: e.target.value }))}
                  required
                  disabled={profilesLoading}
                  className="w-full rounded-2xl border-2 border-border bg-background px-4 py-2.5 text-sm font-bold text-slate-800 outline-none transition-all focus:border-aura-primary focus:ring-2 focus:ring-(--aura-primary)/25 dark:text-slate-100"
                >
                  <option value="">{profilesLoading ? 'Loading...' : 'Select recipient'}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-ui-soft">Inhalt *</label>
                <textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm((p) => ({ ...p, content: e.target.value }))}
                  required
                  rows={6}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-aura-primary focus:ring-2 focus:ring-(--aura-primary)/25 dark:text-slate-100"
                  placeholder="Schreiben Sie Ihre Nachricht hier..."
                />
              </div>

              {composeError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                  {composeError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <IOSButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCompose(false)}
                  className="px-6 py-2.5 font-bold"
                >
                  Abbrechen
                </IOSButton>
                <IOSButton
                  type="submit"
                  disabled={composing || !composeForm.recipient_id || !composeForm.content.trim()}
                  className="px-8 py-2.5 font-bold shadow-lg shadow-black/10"
                >
                  {composing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Senden...
                    </span>
                  ) : (
                    'Senden'
                  )}
                </IOSButton>
              </div>
            </form>
          </IOSCard>
        </div>
      )}
    </div>
  )
}

