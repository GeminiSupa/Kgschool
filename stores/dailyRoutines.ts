import { defineStore } from 'pinia'

export interface DailyRoutine {
  id: string
  group_id: string
  routine_name: string
  start_time: string
  end_time?: string
  day_of_week?: number // 0=Sunday, 6=Saturday, null=every day
  description?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useDailyRoutinesStore = defineStore('dailyRoutines', {
  state: () => ({
    dailyRoutines: [] as DailyRoutine[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchDailyRoutines(groupId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('daily_routines').select('*').order('start_time', { ascending: true })

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        query = query.eq('is_active', true)

        const { data, error } = await query

        if (error) throw error
        this.dailyRoutines = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching daily routines:', e)
      } finally {
        this.loading = false
      }
    },

    async createDailyRoutine(routineData: Partial<DailyRoutine>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('daily_routines')
          .insert([routineData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating daily routine:', e)
        throw e
      }
    },

    async updateDailyRoutine(id: string, routineData: Partial<DailyRoutine>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('daily_routines')
          .update(routineData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating daily routine:', e)
        throw e
      }
    },

    async deleteDailyRoutine(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('daily_routines')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting daily routine:', e)
        throw e
      }
    }
  }
})
