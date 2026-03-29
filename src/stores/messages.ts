import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  child_id?: string
  content: string
  attachments: string[]
  read_at?: string
  created_at: string
}

interface MessagesState {
  messages: Message[]
  unreadCount: number
  loading: boolean
  error: Error | null
  fetchMessages: (userId: string, type?: 'inbox' | 'outbox' | 'all') => Promise<void>
  sendMessage: (messageData: Partial<Message>) => Promise<Message>
  markAsRead: (messageId: string) => Promise<void>
  inbox: (userId: string) => Message[]
  outbox: (userId: string) => Message[]
  unread: (userId: string) => Message[]
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,

  inbox: (userId: string) => get().messages.filter(m => m.recipient_id === userId),
  outbox: (userId: string) => get().messages.filter(m => m.sender_id === userId),
  unread: (userId: string) => get().messages.filter(m => m.recipient_id === userId && !m.read_at),

  fetchMessages: async (userId, type = 'all') => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('messages').select('*')

      if (type === 'inbox') {
        query = query.eq('recipient_id', userId)
      } else if (type === 'outbox') {
        query = query.eq('sender_id', userId)
      } else {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      const messages = data || []
      const unreadCount = messages.filter((m: Message) => m.recipient_id === userId && !m.read_at).length
      set({ messages, unreadCount })
    } catch (e: any) {
      console.error('Error fetching messages:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  sendMessage: async (messageData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages').insert([messageData]).select().single()
      if (error) throw error
      return data as Message
    } catch (e: any) {
      console.error('Error sending message:', e)
      throw e
    }
  },

  markAsRead: async (messageId) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('messages').update({ read_at: new Date().toISOString() }).eq('id', messageId)
      if (error) throw error

      set(state => ({
        messages: state.messages.map(m =>
          m.id === messageId ? { ...m, read_at: new Date().toISOString() } : m
        )
      }))
    } catch (e: any) {
      console.error('Error marking message as read:', e)
      throw e
    }
  }
}))
