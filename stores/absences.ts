import { defineStore } from 'pinia'

export interface AbsenceNotification {
  id: string
  child_id: string
  absence_date: string
  notified_at: string
  notified_by: string
  deadline_met: boolean
  notification_method?: 'app' | 'email' | 'phone'
  notes?: string
  created_at: string
}

export const useAbsencesStore = defineStore('absences', {
  state: () => ({
    notifications: [] as AbsenceNotification[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchNotifications(childId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('absence_notifications')
          .select('*')
          .order('absence_date', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }

        const { data, error } = await query

        if (error) throw error
        this.notifications = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching absence notifications:', e)
      } finally {
        this.loading = false
      }
    },

    async createNotification(notificationData: Partial<AbsenceNotification>) {
      try {
        const supabase = useSupabaseClient()
        
        // Check deadline using database function
        const { data: deadlineData, error: deadlineError } = await supabase
          .rpc('check_informed_absence_deadline', {
            p_absence_date: notificationData.absence_date,
            p_notification_time: new Date().toISOString()
          })

        if (deadlineError) throw deadlineError

        const { data, error } = await supabase
          .from('absence_notifications')
          .insert([{
            ...notificationData,
            notified_at: new Date().toISOString(),
            deadline_met: deadlineData || false
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating absence notification:', e)
        throw e
      }
    },

    async deleteNotification(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('absence_notifications')
          .delete()
          .eq('id', id)

        if (error) throw error
        await this.fetchNotifications()
      } catch (e: any) {
        console.error('Error deleting notification:', e)
        throw e
      }
    }
  }
})
