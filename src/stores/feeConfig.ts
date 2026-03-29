import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface FeeConfigState {
  configs: FeeConfig[]
  loading: boolean
  error: Error | null
  fetchConfigs: (groupId?: string, feeType?: string) => Promise<void>
  getCurrentConfig: (groupId: string, feeType: string) => Promise<FeeConfig | null>
  createConfig: (data: Partial<FeeConfig>) => Promise<FeeConfig>
  updateConfig: (id: string, data: Partial<FeeConfig>) => Promise<FeeConfig>
  deleteConfig: (id: string) => Promise<void>
}

export const useFeeConfigStore = create<FeeConfigState>((set, get) => ({
  configs: [],
  loading: false,
  error: null,

  fetchConfigs: async (groupId, feeType) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('fee_config').select('*')
      if (groupId) query = query.eq('group_id', groupId)
      if (feeType) query = query.eq('fee_type', feeType)
      query = query.order('effective_from', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ configs: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  getCurrentConfig: async (groupId, feeType) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_current_fee_config', {
          p_group_id: groupId,
          p_fee_type: feeType
        })
      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (e: any) { throw e }
  },

  createConfig: async (configData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('fee_config').insert([configData]).select().single()
      if (error) throw error
      return data as FeeConfig
    } catch (e: any) { throw e }
  },

  updateConfig: async (id, configData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('fee_config').update(configData).eq('id', id).select().single()
      if (error) throw error
      return data as FeeConfig
    } catch (e: any) { throw e }
  },

  deleteConfig: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('fee_config').delete().eq('id', id)
      if (error) throw error
    } catch (e: any) { throw e }
  }
}))
