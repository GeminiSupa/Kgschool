import { defineStore } from 'pinia'

export interface Observation {
  id: string
  child_id: string
  observer_id: string
  observation_date: string
  context?: string
  description: string
  development_area?: string
  photos: string[]
  videos: string[]
  created_at: string
  updated_at: string
}

export const useObservationsStore = defineStore('observations', {
  state: () => ({
    observations: [] as Observation[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchObservations(childId?: string, date?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('observations').select('*').order('observation_date', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (date) {
          query = query.eq('observation_date', date)
        }

        const { data, error } = await query

        if (error) throw error
        this.observations = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching observations:', e)
      } finally {
        this.loading = false
      }
    },

    async createObservation(observationData: Partial<Observation>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('observations')
          .insert([{
            ...observationData,
            observer_id: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating observation:', e)
        throw e
      }
    },

    async updateObservation(id: string, observationData: Partial<Observation>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('observations')
          .update(observationData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating observation:', e)
        throw e
      }
    },

    async deleteObservation(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('observations')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting observation:', e)
        throw e
      }
    }
  }
})
