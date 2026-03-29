import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'

export interface Child {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  group_id?: string
  parent_ids: string[]
  photo_url?: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  kita_id?: string
}

interface ChildrenState {
  children: Child[]
  loading: boolean
  error: Error | null
  fetchChildren: (kitaId?: string) => Promise<void>
  fetchChildById: (id: string) => Promise<Child | null>
  fetchChildrenForTeacher: (teacherId: string) => Promise<void>
}

export const useChildrenStore = create<ChildrenState>((set, get) => ({
  children: [],
  loading: false,
  error: null,

  fetchChildren: async (kitaId?: string) => {
    set({ loading: true, error: null })

    try {
      const supabase = createClient()
      const resolvedKitaId = kitaId ?? (await getActiveKitaId())
      let query = supabase
        .from('children')
        .select('*')
        .order('first_name', { ascending: true })

      if (resolvedKitaId) query = query.eq('kita_id', resolvedKitaId)

      const { data, error } = await query

      if (error) throw error
      set({ children: data || [] })
    } catch (e: any) {
      console.error('Error fetching children:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  fetchChildById: async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Child
    } catch (e: any) {
      console.error('Error fetching child:', e)
      return null
    }
  },

  fetchChildrenForTeacher: async (teacherId: string) => {
    set({ loading: true, error: null })

    try {
      const supabase = createClient()
      
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .eq('educator_id', teacherId)

      if (groupsError) throw groupsError

      if (!groups || groups.length === 0) {
        set({ children: [] })
        return
      }

      const groupIds = groups.map(g => g.id)
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .in('group_id', groupIds)
        .order('first_name', { ascending: true })

      if (error) throw error
      set({ children: data || [] })
    } catch (e: any) {
      console.error('Error fetching children for teacher:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  }
}))
