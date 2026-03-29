import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface SalaryConfigState {
  configs: SalaryConfig[]
  loading: boolean
  error: Error | null
  fetchConfigs: (staffId?: string) => Promise<void>
  getCurrentConfig: (staffId: string) => Promise<SalaryConfig | null>
  createConfig: (data: Partial<SalaryConfig>) => Promise<SalaryConfig>
  updateConfig: (id: string, data: Partial<SalaryConfig>) => Promise<SalaryConfig>
  deleteConfig: (id: string) => Promise<void>
}

export const useSalaryConfigStore = create<SalaryConfigState>((set) => ({
  configs: [],
  loading: false,
  error: null,

  fetchConfigs: async (staffId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('staff_salary_config').select('*')
      if (staffId) query = query.eq('staff_id', staffId)
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

  getCurrentConfig: async (staffId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_current_salary_config', { p_staff_id: staffId })
      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (e: any) {
      throw e
    }
  },

  createConfig: async (configData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_salary_config')
        .insert([configData])
        .select()
        .single()
      if (error) throw error
      return data as SalaryConfig
    } catch (e: any) {
      throw e
    }
  },

  updateConfig: async (id, configData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_salary_config')
        .update(configData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as SalaryConfig
    } catch (e: any) {
      throw e
    }
  },

  deleteConfig: async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('staff_salary_config').delete().eq('id', id)
      if (error) throw error
    } catch (e: any) {
      throw e
    }
  }
}))
