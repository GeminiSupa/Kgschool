'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.messages'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

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
    Promise.all([
      fetchMessages(user.id, 'all'),
      supabase.from('profiles').select('*').neq('id', user.id).order('full_name').then(({ data }) => {
        setProfiles(data || [])
      })
    ])
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
        <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-4 border-b border-black/10">
        {(['inbox', 'outbox'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold text-sm capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#667eea] text-[#667eea]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
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
        <button
          onClick={() => setShowCompose(true)}
          className="ml-auto mb-1 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl shadow-md hover:opacity-90 transition-all"
        >
          ➕ Verfassen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="mb-6"><ErrorAlert message={error.message || 'Fehler'} /></div>
      ) : (
        <IOSCard className="overflow-hidden p-0">
          {displayMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-5xl opacity-40 mb-4">{activeTab === 'inbox' ? '📬' : '📤'}</div>
              <p className="font-medium">
                {activeTab === 'inbox' ? 'Keine Nachrichten im Posteingang' : 'Keine gesendeten Nachrichten'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {displayMessages.map(msg => (
                <Link key={msg.id} href={`/admin/messages/${msg.id}`}
                  className={`block p-5 hover:bg-white/60 transition-colors ${!msg.read_at && activeTab === 'inbox' ? 'bg-blue-50/40' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-gray-900 ${!msg.read_at && activeTab === 'inbox' ? 'font-bold' : ''}`}>
                        {activeTab === 'inbox' ? getName(msg.sender_id) : getName(msg.recipient_id)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1 overflow-hidden">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(msg.created_at)}</p>
                    </div>
                    {!msg.read_at && activeTab === 'inbox' && (
                      <div className="ml-4 flex-shrink-0 w-2.5 h-2.5 bg-[#667eea] rounded-full" />
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
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-2xl w-full border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">Nachricht verfassen</h3>
                <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Empfänger *</label>
                  <select required value={composeForm.recipient_id}
                    onChange={e => setComposeForm({ ...composeForm, recipient_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none text-gray-900">
                    <option value="">Empfänger auswählen</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nachricht *</label>
                  <textarea required rows={6} value={composeForm.content}
                    onChange={e => setComposeForm({ ...composeForm, content: e.target.value })}
                    placeholder="Ihre Nachricht..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none resize-none text-gray-900" />
                </div>
                {composeError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{composeError}</div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCompose(false)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                    Abbrechen
                  </button>
                  <button type="submit" disabled={composeLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-medium shadow-md hover:opacity-90 disabled:opacity-50 transition-all">
                    {composeLoading ? 'Wird gesendet...' : 'Senden'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
