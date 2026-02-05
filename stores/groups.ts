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
    async fetchGroups(kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('groups')
          .select('*')
          .order('name', { ascending: true })

        // Add kita_id filter if provided or get from user
        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        } else {
          // Try to get user's kita_id
          const { getUserKitaId } = useKita()
          const userKitaId = await getUserKitaId()
          if (userKitaId) {
            query = query.eq('kita_id', userKitaId)
          }
        }

        const { data, error } = await query

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

        // Get group's kita_id first
        const { data: groupData } = await supabase
          .from('groups')
          .select('kita_id')
          .eq('id', groupId)
          .single()

        // Count active children in group (with kita filter if available)
        let countQuery = supabase
          .from('children')
          .select('id', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('status', 'active')

        if (groupData?.kita_id) {
          countQuery = countQuery.eq('kita_id', groupData.kita_id)
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
  },

  getters: {
    // Removed getGroupCapacity getter - using action instead to avoid conflicts
  }
})
