import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface ChildContract {
  id: string
  child_id: string
  kita_id: string
  contract_number?: string
  start_date: string
  end_date?: string
  betreuung_hours_type: '25' | '35' | '45' | 'ganztag' | 'halbtag'
  fee_category: 'standard' | 'reduced' | 'waived' | 'subsidized'
  lunch_obligation: boolean
  lunch_billing_type: 'flat_monthly' | 'per_meal' | 'hybrid'
  lunch_flat_rate_amount?: number
  subsidy_type?: 'BuT' | 'BremenPass' | 'Geschwisterrabatt' | 'Landeszuschuss' | 'other'
  subsidy_amount: number
  notes?: string
  status: 'active' | 'suspended' | 'terminated' | 'pending'
  created_at: string
  updated_at: string
}

interface ContractsState {
  contracts: ChildContract[]
  loading: boolean
  error: Error | null
  fetchContracts: (childId?: string, kitaId?: string, status?: string) => Promise<void>
  createContract: (data: Partial<ChildContract>) => Promise<ChildContract>
  updateContract: (id: string, updates: Partial<ChildContract>) => Promise<ChildContract>
  terminateContract: (id: string, endDate: string) => Promise<ChildContract>
}

export const useContractsStore = create<ContractsState>((set) => ({
  contracts: [],
  loading: false,
  error: null,

  fetchContracts: async (childId, kitaId, status) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('child_contracts').select('*')
      if (childId) query = query.eq('child_id', childId)
      if (kitaId) query = query.eq('kita_id', kitaId)
      if (status) query = query.eq('status', status)
      query = query.order('start_date', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ contracts: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createContract: async (contractData) => {
    try {
      const supabase = createClient()
      const year = new Date().getFullYear()
      const { count } = await supabase.from('child_contracts').select('*', { count: 'exact', head: true }).gte('created_at', `${year}-01-01`)
      const contractNumber = contractData.contract_number || `CT-${year}-${String((count || 0) + 1).padStart(4, '0')}`
      
      const { data, error } = await supabase.from('child_contracts').insert([{ ...contractData, contract_number: contractNumber }]).select().single()
      if (error) throw error
      return data as ChildContract
    } catch (e: any) {
      throw e
    }
  },

  updateContract: async (id, updates) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('child_contracts').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data as ChildContract
    } catch (e: any) {
      throw e
    }
  },

  terminateContract: async (id, endDate) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('child_contracts').update({ status: 'terminated', end_date: endDate }).eq('id', id).select().single()
      if (error) throw error
      return data as ChildContract
    } catch (e: any) {
      throw e
    }
  }
}))
