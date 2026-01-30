import { defineStore } from 'pinia'

export interface BillingTimetable {
  id: string
  group_id: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  effective_from: string
  effective_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useBillingTimetableStore = defineStore('billingTimetable', {
  state: () => ({
    timetables: [] as BillingTimetable[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchTimetables(groupId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('billing_timetable')
          .select('*')
          .order('effective_from', { ascending: false })

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        const { data, error } = await query

        if (error) throw error
        this.timetables = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching billing timetables:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchTimetableById(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('billing_timetable')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching billing timetable:', e)
        throw e
      }
    },

    async createTimetable(timetable: Partial<BillingTimetable>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('billing_timetable')
          .insert([timetable])
          .select()
          .single()

        if (error) throw error
        await this.fetchTimetables()
        return data
      } catch (e: any) {
        console.error('Error creating billing timetable:', e)
        throw e
      }
    },

    async updateTimetable(id: string, updates: Partial<BillingTimetable>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('billing_timetable')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        await this.fetchTimetables()
        return data
      } catch (e: any) {
        console.error('Error updating billing timetable:', e)
        throw e
      }
    },

    async deleteTimetable(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('billing_timetable')
          .delete()
          .eq('id', id)

        if (error) throw error
        await this.fetchTimetables()
      } catch (e: any) {
        console.error('Error deleting billing timetable:', e)
        throw e
      }
    }
  }
})
