import { defineStore } from 'pinia'

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

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [] as Message[],
    unreadCount: 0,
    loading: false,
    error: null as Error | null
  }),

  getters: {
    inbox: (state) => (userId: string) => {
      return state.messages.filter(m => m.recipient_id === userId)
    },
    outbox: (state) => (userId: string) => {
      return state.messages.filter(m => m.sender_id === userId)
    },
    unread: (state) => (userId: string) => {
      return state.messages.filter(m => m.recipient_id === userId && !m.read_at)
    }
  },

  actions: {
    async fetchMessages(userId: string, type: 'inbox' | 'outbox' | 'all' = 'all') {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('messages').select('*')

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
        this.messages = data || []

        // Update unread count
        this.unreadCount = this.unread(userId).length
      } catch (e: any) {
        this.error = e
        console.error('Error fetching messages:', e)
      } finally {
        this.loading = false
      }
    },

    async sendMessage(messageData: Partial<Message>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('messages')
          .insert([messageData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error sending message:', e)
        throw e
      }
    },

    async markAsRead(messageId: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', messageId)

        if (error) throw error

        // Update local state
        const message = this.messages.find(m => m.id === messageId)
        if (message) {
          message.read_at = new Date().toISOString()
        }
      } catch (e: any) {
        console.error('Error marking message as read:', e)
        throw e
      }
    }
  }
})
