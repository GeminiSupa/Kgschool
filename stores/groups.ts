import { defineStore } from 'pinia'

export interface Group {
  id: string
  name: string
  age_range: string
  educator_id?: string
  capacity: number
  created_at: string
  updated_at: string
}

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    groups: [] as Group[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchGroups() {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('name', { ascending: true })

        if (error) throw error
        this.groups = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching groups:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchGroupById(id: string): Promise<Group | null> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching group:', e)
        return null
      }
    },

    async fetchGroupTeachers(groupId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .rpc('get_active_group_teachers', { p_group_id: groupId })

        if (error) throw error
        return data || []
      } catch (e: any) {
        console.error('Error fetching group teachers:', e)
        return []
      }
    },

    async getGroupCapacity(groupId: string) {
      try {
        const supabase = useSupabaseClient()
        
        // Get group capacity
        const { data: group } = await supabase
          .from('groups')
          .select('capacity')
          .eq('id', groupId)
          .single()

        if (!group) return { current: 0, max: 0, available: 0 }

        // Count active children in group
        const { count } = await supabase
          .from('children')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active')

        const current = count || 0
        const max = group.capacity || 0
        const available = Math.max(0, max - current)

        return { current, max, available }
      } catch (e: any) {
        console.error('Error getting group capacity:', e)
        return { current: 0, max: 0, available: 0 }
      }
    }
  },

  getters: {
    getGroupCapacity: (state) => async (groupId: string) => {
      const supabase = useSupabaseClient()
      
      const group = state.groups.find(g => g.id === groupId)
      if (!group) return { current: 0, max: 0, available: 0 }

      try {
        const { count } = await supabase
          .from('children')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active')

        const current = count || 0
        const max = group.capacity || 0
        const available = Math.max(0, max - current)

        return { current, max, available }
      } catch (e: any) {
        console.error('Error getting group capacity:', e)
        return { current: 0, max: 0, available: 0 }
      }
    }
  }
})
