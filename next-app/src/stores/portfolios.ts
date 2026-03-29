import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface PortfoliosState {
  portfolios: Portfolio[]
  loading: boolean
  error: Error | null
  fetchPortfolios: (childId?: string) => Promise<void>
  createPortfolio: (data: Partial<Portfolio>, userId: string) => Promise<Portfolio>
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<Portfolio>
  deletePortfolio: (id: string) => Promise<void>
}

export const usePortfoliosStore = create<PortfoliosState>((set, get) => ({
  portfolios: [],
  loading: false,
  error: null,

  fetchPortfolios: async (childId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('portfolios').select('*').order('date', { ascending: false })
      if (childId) query = query.eq('child_id', childId)
      const { data, error } = await query
      if (error) throw error
      set({ portfolios: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createPortfolio: async (portfolioData, userId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('portfolios')
        .insert([{ ...portfolioData, created_by: userId }])
        .select()
        .single()
      if (error) throw error
      return data as Portfolio
    } catch (e: any) { throw e }
  },

  updatePortfolio: async (id, portfolioData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('portfolios')
        .update(portfolioData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Portfolio
    } catch (e: any) { throw e }
  },

  deletePortfolio: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('portfolios').delete().eq('id', id)
      if (error) throw error
    } catch (e: any) { throw e }
  }
}))
