import { defineStore } from 'pinia'

export interface DailyReport {
  id: string
  group_id: string
  report_date: string
  educator_id: string
  title: string
  content: string
  activities: string[]
  photos: string[]
  weather?: string
  special_events?: string
  created_at: string
  updated_at: string
}

export const useDailyReportsStore = defineStore('dailyReports', {
  state: () => ({
    dailyReports: [] as DailyReport[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchDailyReports(groupId?: string, date?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('daily_reports').select('*').order('report_date', { ascending: false })

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        if (date) {
          query = query.eq('report_date', date)
        }

        const { data, error } = await query

        if (error) throw error
        this.dailyReports = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching daily reports:', e)
      } finally {
        this.loading = false
      }
    },

    async createDailyReport(reportData: Partial<DailyReport>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('daily_reports')
          .insert([{
            ...reportData,
            educator_id: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating daily report:', e)
        throw e
      }
    },

    async updateDailyReport(id: string, reportData: Partial<DailyReport>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating daily report:', e)
        throw e
      }
    },

    async deleteDailyReport(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('daily_reports')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting daily report:', e)
        throw e
      }
    }
  }
})
