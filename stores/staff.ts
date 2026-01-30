import { defineStore } from 'pinia'

export interface Staff {
  id: string
  role: 'teacher' | 'kitchen' | 'support'
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export const useStaffStore = defineStore('staff', {
  state: () => ({
    staff: [] as Staff[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchStaff(role?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('profiles')
          .select('*')
          .in('role', ['teacher', 'kitchen', 'support'])

        if (role) {
          query = query.eq('role', role)
        }

        query = query.order('full_name', { ascending: true })

        const { data, error } = await query

        if (error) throw error
        this.staff = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching staff:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchStaffById(id: string): Promise<Staff | null> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching staff:', e)
        return null
      }
    }
  }
})
