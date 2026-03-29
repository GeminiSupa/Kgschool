import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface LeaveRequestsState {
  leaveRequests: LeaveRequest[]
  loading: boolean
  error: Error | null
  fetchLeaveRequests: (childId?: string, status?: string) => Promise<void>
  createLeaveRequest: (data: Partial<LeaveRequest>) => Promise<LeaveRequest>
  updateLeaveRequestStatus: (id: string, status: 'approved' | 'rejected', adminNotes?: string) => Promise<LeaveRequest>
}

export const useLeaveRequestsStore = create<LeaveRequestsState>((set) => ({
  leaveRequests: [],
  loading: false,
  error: null,

  fetchLeaveRequests: async (childId?: string, status?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('leave_requests').select('*')
      if (childId) query = query.eq('child_id', childId)
      if (status) query = query.eq('status', status)
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ leaveRequests: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createLeaveRequest: async (leaveData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('leave_requests').insert([leaveData]).select().single()
      if (error) throw error
      return data as LeaveRequest
    } catch (e: any) { throw e }
  },

  updateLeaveRequestStatus: async (id, status, adminNotes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id
      }
      if (adminNotes) updateData.admin_notes = adminNotes

      const { data, error } = await supabase
        .from('leave_requests').update(updateData).eq('id', id).select().single()
      if (error) throw error

      // If approved, auto-create absence attendance records
      if (status === 'approved' && data) {
        const start = new Date(data.start_date)
        const end = new Date(data.end_date)
        const records: any[] = []
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dow = d.getDay()
          if (dow === 0 || dow === 6) continue
          const dateStr = d.toISOString().split('T')[0]
          const { data: existing } = await supabase
            .from('attendance').select('id').eq('child_id', data.child_id).eq('date', dateStr).single()
          if (!existing) {
            records.push({ child_id: data.child_id, date: dateStr, status: 'absent', leave_request_id: data.id, notes: `Leave: ${data.leave_type}` })
          }
        }
        if (records.length > 0) {
          await supabase.from('attendance').insert(records)
        }
      }
      return data as LeaveRequest
    } catch (e: any) { throw e }
  }
}))
