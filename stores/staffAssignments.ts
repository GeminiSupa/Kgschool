import { defineStore } from 'pinia'

export interface StaffAssignment {
  id: string
  child_id: string
  staff_id: string
  assignment_type: 'primary_teacher' | 'assistant_teacher' | 'support_staff'
  start_date: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useStaffAssignmentsStore = defineStore('staffAssignments', {
  state: () => ({
    assignments: [] as StaffAssignment[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchAssignments(childId?: string, staffId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('staff_assignments').select('*')

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (staffId) {
          query = query.eq('staff_id', staffId)
        }

        query = query.order('start_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.assignments = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching staff assignments:', e)
      } finally {
        this.loading = false
      }
    },

    async createAssignment(assignmentData: Partial<StaffAssignment>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_assignments')
          .insert([assignmentData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating staff assignment:', e)
        throw e
      }
    },

    async updateAssignment(id: string, assignmentData: Partial<StaffAssignment>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_assignments')
          .update(assignmentData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating staff assignment:', e)
        throw e
      }
    },

    async deleteAssignment(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('staff_assignments')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting staff assignment:', e)
        throw e
      }
    },

    async bulkAssignToGroup(groupId: string, staffId: string, assignmentType: StaffAssignment['assignment_type'], startDate?: string) {
      try {
        const supabase = useSupabaseClient()
        
        // Get all children in the group
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id')
          .eq('group_id', groupId)
          .eq('status', 'active')

        if (childrenError) throw childrenError
        if (!children || children.length === 0) {
          return { success: true, count: 0 }
        }

        // Create assignments for all children
        const assignments = children.map(child => ({
          child_id: child.id,
          staff_id: staffId,
          assignment_type: assignmentType,
          start_date: startDate || new Date().toISOString().split('T')[0]
        }))

        const { data, error } = await supabase
          .from('staff_assignments')
          .insert(assignments)
          .select()

        if (error) throw error
        return { success: true, count: data?.length || 0 }
      } catch (e: any) {
        console.error('Error bulk assigning staff:', e)
        throw e
      }
    }
  }
})
