import { defineStore } from 'pinia'

export interface NapRecord {
  id: string
  child_id: string
  nap_date: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  notes?: string
  recorded_by: string
  created_at: string
}

export const useNapRecordsStore = defineStore('napRecords', {
  state: () => ({
    napRecords: [] as NapRecord[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchNapRecords(childId?: string, date?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('nap_records').select('*').order('nap_date', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (date) {
          query = query.eq('nap_date', date)
        }

        const { data, error } = await query

        if (error) throw error
        this.napRecords = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching nap records:', e)
      } finally {
        this.loading = false
      }
    },

    async createNapRecord(napData: Partial<NapRecord>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('nap_records')
          .insert([{
            ...napData,
            recorded_by: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating nap record:', e)
        throw e
      }
    },

    async updateNapRecord(id: string, napData: Partial<NapRecord>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('nap_records')
          .update(napData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating nap record:', e)
        throw e
      }
    }
  }
})
