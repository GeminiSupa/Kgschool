import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Staff {
  id: string
  role: 'teacher' | 'kitchen' | 'support' | 'admin'
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface StaffState {
  staff: Staff[]
  loading: boolean
  error: Error | null
  fetchStaff: (role?: string) => Promise<void>
  fetchStaffById: (id: string) => Promise<Staff | null>
}

export const useStaffStore = create<StaffState>((set) => ({
  staff: [],
  loading: false,
  error: null,

  fetchStaff: async (role?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['teacher', 'kitchen', 'support', 'admin'])

      if (role) {
        query = query.eq('role', role)
      }

      query = query.order('full_name', { ascending: true })

      const { data, error } = await query
      if (error) throw error
      set({ staff: data || [] })
    } catch (e: any) {
      set({ error: e })
      console.error('Error fetching staff:', e)
    } finally {
      set({ loading: false })
    }
  },

  fetchStaffById: async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (e: any) {
      console.error('Error fetching staff by ID:', e)
      return null
    }
  }
}))
