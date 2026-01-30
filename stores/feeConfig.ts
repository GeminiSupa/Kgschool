import { defineStore } from 'pinia'

export interface FeeConfig {
  id: string
  fee_type: 'tuition' | 'lunch' | 'activities' | 'other'
  group_id?: string
  amount: number
  effective_from: string
  effective_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useFeeConfigStore = defineStore('feeConfig', {
  state: () => ({
    configs: [] as FeeConfig[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchConfigs(groupId?: string, feeType?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('fee_config').select('*')

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        if (feeType) {
          query = query.eq('fee_type', feeType)
        }

        query = query.order('effective_from', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.configs = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching fee configs:', e)
      } finally {
        this.loading = false
      }
    },

    async getCurrentConfig(groupId: string, feeType: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .rpc('get_current_fee_config', {
            p_group_id: groupId,
            p_fee_type: feeType
          })

        if (error) throw error
        return data && data.length > 0 ? data[0] : null
      } catch (e: any) {
        console.error('Error getting current fee config:', e)
        throw e
      }
    },

    async createConfig(configData: Partial<FeeConfig>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('fee_config')
          .insert([configData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating fee config:', e)
        throw e
      }
    },

    async updateConfig(id: string, configData: Partial<FeeConfig>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('fee_config')
          .update(configData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating fee config:', e)
        throw e
      }
    },

    async deleteConfig(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('fee_config')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting fee config:', e)
        throw e
      }
    }
  }
})
