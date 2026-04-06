import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'

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
      const kitaId = await getActiveKitaId()
      if (!kitaId) {
        set({ staff: [] })
        return
      }
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      if (tenantIds.length === 0) {
        set({ staff: [] })
        return
      }

      let query = supabase
        .from('profiles')
        .select('*')
        .in('id', tenantIds)
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
      const kitaId = await getActiveKitaId()
      if (!kitaId) return null
      const tenantIds = await getProfileIdsForKita(supabase, kitaId)
      if (!tenantIds.includes(id)) return null

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
