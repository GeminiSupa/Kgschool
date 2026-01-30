import { defineStore } from 'pinia'

export interface TeacherLeaveRequest {
  id: string
  teacher_id: string
  start_date: string
  end_date: string
  leave_type: 'vacation' | 'sick' | 'personal' | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export const useTeacherLeaveRequestsStore = defineStore('teacherLeaveRequests', {
  state: () => ({
    leaveRequests: [] as TeacherLeaveRequest[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchLeaveRequests(teacherId?: string, status?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('teacher_leave_requests').select('*')

        if (teacherId) {
          query = query.eq('teacher_id', teacherId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.leaveRequests = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching teacher leave requests:', e)
      } finally {
        this.loading = false
      }
    },

    async createLeaveRequest(leaveData: Partial<TeacherLeaveRequest>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('teacher_leave_requests')
          .insert([{
            ...leaveData,
            teacher_id: authStore.user?.id
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating teacher leave request:', e)
        throw e
      }
    },

    async updateLeaveRequestStatus(id: string, status: 'approved' | 'rejected', adminNotes?: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const updateData: any = {
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: authStore.user?.id
        }

        if (adminNotes) {
          updateData.admin_notes = adminNotes
        }

        const { data, error } = await supabase
          .from('teacher_leave_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating teacher leave request status:', e)
        throw e
      }
    },

    async deleteLeaveRequest(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('teacher_leave_requests')
          .delete()
          .eq('id', id)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting teacher leave request:', e)
        throw e
      }
    }
  }
})
