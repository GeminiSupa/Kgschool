import { defineStore } from 'pinia'

export interface LearningTheme {
  id: string
  group_id?: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  educator_id?: string
  photos: string[]
  activities: string[]
  learning_areas: string[]
  status: 'active' | 'completed' | 'planned'
  created_at: string
  updated_at: string
}

export const useLearningThemesStore = defineStore('learningThemes', {
  state: () => ({
    learningThemes: [] as LearningTheme[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchLearningThemes(groupId?: string, status?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('learning_themes').select('*').order('created_at', { ascending: false })

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) throw error
        this.learningThemes = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching learning themes:', e)
      } finally {
        this.loading = false
      }
    },

    async createLearningTheme(themeData: Partial<LearningTheme>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('learning_themes')
          .insert([{
            ...themeData,
            educator_id: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating learning theme:', e)
        throw e
      }
    },

    async updateLearningTheme(id: string, themeData: Partial<LearningTheme>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('learning_themes')
          .update(themeData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating learning theme:', e)
        throw e
      }
    },

    async deleteLearningTheme(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('learning_themes')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting learning theme:', e)
        throw e
      }
    }
  }
})
