import { defineStore } from 'pinia'

export interface GroupTeacher {
  id: string
  group_id: string
  teacher_id: string
  role: 'primary' | 'assistant' | 'support'
  start_date: string
  end_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const useGroupTeachersStore = defineStore('groupTeachers', {
  state: () => ({
    assignments: [] as GroupTeacher[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchGroupTeachers(groupId: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('group_teachers')
          .select('*')
          .eq('group_id', groupId)
          .order('start_date', { ascending: false })

        if (error) throw error
        this.assignments = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching group teachers:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchTeacherGroups(teacherId: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('group_teachers')
          .select('*, groups(*)')
          .eq('teacher_id', teacherId)
          .is('end_date', null)
          .order('start_date', { ascending: false })

        if (error) throw error
        return data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching teacher groups:', e)
        return []
      } finally {
        this.loading = false
      }
    },

    async assignTeacherToGroup(assignmentData: Partial<GroupTeacher>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('group_teachers')
          .insert([assignmentData])
          .select()
          .single()

        if (error) throw error

        // If this is a primary teacher, update groups.educator_id for backward compatibility
        if (assignmentData.role === 'primary' && assignmentData.group_id) {
          await supabase
            .from('groups')
            .update({ educator_id: assignmentData.teacher_id })
            .eq('id', assignmentData.group_id)
        }

        return data
      } catch (e: any) {
        console.error('Error assigning teacher to group:', e)
        throw e
      }
    },

    async updateAssignment(id: string, assignmentData: Partial<GroupTeacher>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('group_teachers')
          .update(assignmentData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // If role changed to primary, update groups.educator_id
        if (assignmentData.role === 'primary' && data) {
          await supabase
            .from('groups')
            .update({ educator_id: data.teacher_id })
            .eq('id', data.group_id)
        }

        return data
      } catch (e: any) {
        console.error('Error updating group teacher assignment:', e)
        throw e
      }
    },

    async removeTeacherFromGroup(id: string) {
      try {
        const supabase = useSupabaseClient()
        
        // Get assignment before deleting
        const { data: assignment } = await supabase
          .from('group_teachers')
          .select('group_id, teacher_id, role')
          .eq('id', id)
          .single()

        const { error } = await supabase
          .from('group_teachers')
          .delete()
          .eq('id', id)

        if (error) throw error

        // If this was the primary teacher, clear groups.educator_id or assign new primary
        if (assignment && assignment.role === 'primary') {
          // Check if there's another primary teacher
          const { data: otherPrimary } = await supabase
            .from('group_teachers')
            .select('teacher_id')
            .eq('group_id', assignment.group_id)
            .eq('role', 'primary')
            .is('end_date', null)
            .limit(1)
            .single()

          if (otherPrimary) {
            await supabase
              .from('groups')
              .update({ educator_id: otherPrimary.teacher_id })
              .eq('id', assignment.group_id)
          } else {
            // No other primary, clear educator_id
            await supabase
              .from('groups')
              .update({ educator_id: null })
              .eq('id', assignment.group_id)
          }
        }
      } catch (e: any) {
        console.error('Error removing teacher from group:', e)
        throw e
      }
    },

    async setPrimaryTeacher(groupId: string, teacherId: string) {
      try {
        const supabase = useSupabaseClient()
        
        // First, set all current primary teachers for this group to assistant
        await supabase
          .from('group_teachers')
          .update({ role: 'assistant' })
          .eq('group_id', groupId)
          .eq('role', 'primary')
          .is('end_date', null)

        // Then set the specified teacher as primary
        const { data, error } = await supabase
          .from('group_teachers')
          .update({ role: 'primary' })
          .eq('group_id', groupId)
          .eq('teacher_id', teacherId)
          .is('end_date', null)
          .select()
          .single()

        if (error) throw error

        // Update groups.educator_id
        await supabase
          .from('groups')
          .update({ educator_id: teacherId })
          .eq('id', groupId)

        return data
      } catch (e: any) {
        console.error('Error setting primary teacher:', e)
        throw e
      }
    }
  }
})
