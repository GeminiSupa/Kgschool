import { defineStore } from 'pinia'

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
}

export const useChildrenStore = defineStore('children', {
  state: () => ({
    children: [] as Child[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchChildren(kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('children')
          .select('*')
          .order('first_name', { ascending: true })

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
        this.children = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching children:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchChildById(id: string): Promise<Child | null> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching child:', e)
        return null
      }
    },

    async fetchChildrenForTeacher(teacherId: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // Get teacher's groups
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('id')
          .eq('educator_id', teacherId)

        if (groupsError) throw groupsError

        if (!groups || groups.length === 0) {
          this.children = []
          return
        }

        const groupIds = groups.map(g => g.id)
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .in('group_id', groupIds)
          .order('first_name', { ascending: true })

        if (error) throw error
        this.children = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching children for teacher:', e)
      } finally {
        this.loading = false
      }
    }
  }
})
