import { defineStore } from 'pinia'

export interface Portfolio {
  id: string
  child_id: string
  title: string
  description?: string
  portfolio_type: 'artwork' | 'photo' | 'achievement' | 'activity' | 'milestone' | 'other'
  content?: string
  attachments: string[]
  date: string
  created_by: string
  created_at: string
  updated_at: string
}

export const usePortfoliosStore = defineStore('portfolios', {
  state: () => ({
    portfolios: [] as Portfolio[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchPortfolios(childId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('portfolios').select('*').order('date', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }

        const { data, error } = await query

        if (error) throw error
        this.portfolios = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching portfolios:', e)
      } finally {
        this.loading = false
      }
    },

    async createPortfolio(portfolioData: Partial<Portfolio>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('portfolios')
          .insert([{
            ...portfolioData,
            created_by: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating portfolio:', e)
        throw e
      }
    },

    async updatePortfolio(id: string, portfolioData: Partial<Portfolio>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('portfolios')
          .update(portfolioData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating portfolio:', e)
        throw e
      }
    },

    async deletePortfolio(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('portfolios')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting portfolio:', e)
        throw e
      }
    }
  }
})
