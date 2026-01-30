import { defineStore } from 'pinia'

export interface SalaryConfig {
  id: string
  staff_id: string
  base_salary: number
  hourly_rate?: number
  overtime_multiplier: number
  effective_from: string
  effective_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useSalaryConfigStore = defineStore('salaryConfig', {
  state: () => ({
    configs: [] as SalaryConfig[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchConfigs(staffId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('staff_salary_config').select('*')

        if (staffId) {
          query = query.eq('staff_id', staffId)
        }

        query = query.order('effective_from', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.configs = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching salary configs:', e)
      } finally {
        this.loading = false
      }
    },

    async getCurrentConfig(staffId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .rpc('get_current_salary_config', { p_staff_id: staffId })

        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      } catch (e: any) {
        console.error('Error getting current salary config:', e)
        throw e
      }
    },

    async createConfig(configData: Partial<SalaryConfig>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_salary_config')
          .insert([configData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating salary config:', e)
        throw e
      }
    },

    async updateConfig(id: string, configData: Partial<SalaryConfig>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_salary_config')
          .update(configData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating salary config:', e)
        throw e
      }
    },

    async deleteConfig(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('staff_salary_config')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting salary config:', e)
        throw e
      }
    }
  }
})
