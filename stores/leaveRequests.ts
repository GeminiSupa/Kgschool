import { defineStore } from 'pinia'

export interface LeaveRequest {
  id: string
  child_id: string
  parent_id: string
  start_date: string
  end_date: string
  leave_type: 'sick' | 'vacation' | 'other'
  reason: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export const useLeaveRequestsStore = defineStore('leaveRequests', {
  state: () => ({
    leaveRequests: [] as LeaveRequest[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchLeaveRequests(childId?: string, status?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('leave_requests').select('*')

        if (childId) {
          query = query.eq('child_id', childId)
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
        console.error('Error fetching leave requests:', e)
      } finally {
        this.loading = false
      }
    },

    async createLeaveRequest(leaveData: Partial<LeaveRequest>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('leave_requests')
          .insert([leaveData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating leave request:', e)
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
          .from('leave_requests')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        // If approved, create attendance records for the date range
        if (status === 'approved') {
          await this.createAttendanceForLeaveRequest(data)
        }

        return data
      } catch (e: any) {
        console.error('Error updating leave request status:', e)
        throw e
      }
    },

    async createAttendanceForLeaveRequest(leaveRequest: LeaveRequest) {
      try {
        const supabase = useSupabaseClient()
        const startDate = new Date(leaveRequest.start_date)
        const endDate = new Date(leaveRequest.end_date)
        const attendanceRecords = []

        // Create attendance records for each date in the range
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
          // Skip weekends (optional - adjust based on requirements)
          const dayOfWeek = date.getDay()
          if (dayOfWeek === 0 || dayOfWeek === 6) continue

          const dateStr = date.toISOString().split('T')[0]
          
          // Check if attendance record already exists
          const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('child_id', leaveRequest.child_id)
            .eq('date', dateStr)
            .single()

          if (!existing) {
            attendanceRecords.push({
              child_id: leaveRequest.child_id,
              date: dateStr,
              status: 'absent',
              leave_request_id: leaveRequest.id,
              notes: `Leave request: ${leaveRequest.leave_type} - ${leaveRequest.reason}`
            })
          }
        }

        if (attendanceRecords.length > 0) {
          const { error } = await supabase
            .from('attendance')
            .insert(attendanceRecords)

          if (error) throw error
        }
      } catch (e: any) {
        console.error('Error creating attendance for leave request:', e)
        throw e
      }
    }
  }
})
