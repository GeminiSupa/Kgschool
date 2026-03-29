import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'

export interface Group {
  id: string
  name: string
  age_range: string
  educator_id?: string
  capacity: number
  description?: string
  created_at: string
  updated_at: string
  kita_id?: string
}

interface GroupsState {
  groups: Group[]
  loading: boolean
  error: Error | null
  fetchGroups: (kitaId?: string) => Promise<void>
  fetchGroupById: (id: string) => Promise<Group | null>
  createGroup: (data: Partial<Group>) => Promise<Group>
  updateGroup: (id: string, data: Partial<Group>) => Promise<Group>
  deleteGroup: (id: string) => Promise<void>
  fetchGroupTeachers: (groupId: string) => Promise<any[]>
  getGroupCapacity: (groupId: string) => Promise<{ current: number; max: number; available: number }>
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  fetchGroups: async (kitaId?: string) => {
    set({ loading: true, error: null })

    try {
      const supabase = createClient()
      const resolvedKitaId = kitaId ?? (await getActiveKitaId())
      let query = supabase
        .from('groups')
        .select('*')
        .order('name', { ascending: true })

      if (resolvedKitaId) query = query.eq('kita_id', resolvedKitaId)

      const { data, error } = await query

      if (error) throw error
      set({ groups: data || [] })
    } catch (e: any) {
      console.error('Error fetching groups:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  fetchGroupById: async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Group
    } catch (e: any) {
      console.error('Error fetching group:', e)
      return null
    }
  },

  createGroup: async (groupData) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('groups').insert([groupData]).select().single()
    if (error) throw error
    set((s) => ({ groups: [data as Group, ...s.groups] }))
    return data as Group
  },

  updateGroup: async (id, groupData) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('groups').update(groupData).eq('id', id).select().single()
    if (error) throw error
    set((s) => ({ groups: s.groups.map((g) => (g.id === id ? (data as Group) : g)) }))
    return data as Group
  },

  deleteGroup: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('groups').delete().eq('id', id)
    if (error) throw error
    set((s) => ({ groups: s.groups.filter((g) => g.id !== id) }))
  },

  fetchGroupTeachers: async (groupId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_active_group_teachers', { p_group_id: groupId })

      if (error) throw error
      return data || []
    } catch (e: any) {
      console.error('Error fetching group teachers:', e)
      return []
    }
  },

  getGroupCapacity: async (groupId: string) => {
    try {
      const supabase = createClient()
      
      const { data: group } = await supabase
        .from('groups')
        .select('capacity, kita_id')
        .eq('id', groupId)
        .single()

      if (!group) return { current: 0, max: 0, available: 0 }

      let countQuery = supabase
        .from('children')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'active')

      if (group.kita_id) {
        countQuery = countQuery.eq('kita_id', group.kita_id)
      }

      const { count } = await countQuery

      const current = count || 0
      const max = group.capacity || 0
      const available = Math.max(0, max - current)

      return { current, max, available }
    } catch (e: any) {
      console.error('Error getting group capacity:', e)
      return { current: 0, max: 0, available: 0 }
    }
  }
}))
