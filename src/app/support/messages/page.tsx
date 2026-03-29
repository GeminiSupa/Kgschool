'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
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
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['parent', 'teacher', 'admin', 'kitchen'])
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
          <Heading size="xl" className="text-gray-900">
            Nachrichten
          </Heading>
          <p className="text-sm text-gray-500 mt-1">Austausch mit Eltern, der Leitung und Support.</p>
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

      <div className="flex gap-2 mb-6 p-1.5 bg-[#f2f2f7] rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'inbox' ? 'bg-white text-[#667eea] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Posteingang
          {unreadCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        </button>
        <button
          onClick={() => setActiveTab('outbox')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'outbox' ? 'bg-white text-[#667eea] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gesendet
        </button>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Nachrichten'} />
      ) : displayMessages.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">💬</div>
          <p className="text-gray-500 font-medium">
            {activeTab === 'inbox' ? 'Keine Nachrichten empfangen.' : 'Keine Nachrichten gesendet.'}
          </p>
        </IOSCard>
      ) : (
        <div className="grid gap-3">
          {displayMessages.map((message) => (
            <IOSCard
              key={message.id}
              onClick={() => handleMarkAsRead(message.id, !!message.read_at)}
              className={`p-0 overflow-hidden cursor-pointer group transition-all duration-300 border-black/5 hover:border-[#667eea]/30 ${
                activeTab === 'inbox' && !message.read_at ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-gray-900 group-hover:text-[#667eea] transition-colors">
                        {getPartnerName(message)}
                      </h4>
                      {activeTab === 'inbox' && !message.read_at && (
                        <span className="px-2 py-0.5 bg-[#667eea] text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                          Neu
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-600 line-clamp-2 leading-relaxed">{message.content}</p>
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mt-4">{formatDate(message.created_at)}</p>
                  </div>
                  <div className="text-gray-200 group-hover:text-[#667eea] transition-colors pt-1">
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
              <Heading size="md" className="text-gray-900">
                Nachricht verfassen
              </Heading>
              <button
                onClick={() => setShowCompose(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-2">
                  Empfänger *
                </label>
                <select
                  value={composeForm.recipient_id}
                  onChange={(e) => setComposeForm((p) => ({ ...p, recipient_id: e.target.value }))}
                  required
                  disabled={profilesLoading}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
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
                <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-2">Inhalt *</label>
                <textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm((p) => ({ ...p, content: e.target.value }))}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all resize-none"
                  placeholder="Schreiben Sie Ihre Nachricht hier..."
                />
              </div>

              {composeError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100">
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
                  className="px-8 py-2.5 font-bold shadow-lg shadow-[#667eea]/20"
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

