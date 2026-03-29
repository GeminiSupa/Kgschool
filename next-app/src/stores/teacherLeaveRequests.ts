import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface TeacherLeaveRequestsState {
  leaveRequests: TeacherLeaveRequest[]
  loading: boolean
  error: Error | null
  fetchLeaveRequests: (teacherId?: string, status?: string) => Promise<void>
  createLeaveRequest: (data: Partial<TeacherLeaveRequest>) => Promise<TeacherLeaveRequest>
  updateLeaveRequestStatus: (id: string, status: 'approved' | 'rejected', adminNotes?: string) => Promise<TeacherLeaveRequest>
  deleteLeaveRequest: (id: string) => Promise<void>
}

export const useTeacherLeaveRequestsStore = create<TeacherLeaveRequestsState>((set) => ({
  leaveRequests: [],
  loading: false,
  error: null,

  fetchLeaveRequests: async (teacherId?: string, status?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('teacher_leave_requests').select('*')
      if (teacherId) query = query.eq('teacher_id', teacherId)
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
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('teacher_leave_requests')
        .insert([{ ...leaveData, teacher_id: user?.id }])
        .select().single()
      if (error) throw error
      return data as TeacherLeaveRequest
    } catch (e: any) { throw e }
  },

  updateLeaveRequestStatus: async (id, status, adminNotes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const updateData: any = { status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }
      if (adminNotes) updateData.admin_notes = adminNotes
      const { data, error } = await supabase
        .from('teacher_leave_requests').update(updateData).eq('id', id).select().single()
      if (error) throw error
      return data as TeacherLeaveRequest
    } catch (e: any) { throw e }
  },

  deleteLeaveRequest: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('teacher_leave_requests').delete().eq('id', id)
      if (error) throw error
      set(s => ({ leaveRequests: s.leaveRequests.filter(r => r.id !== id) }))
    } catch (e: any) { throw e }
  }
}))
