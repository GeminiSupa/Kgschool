import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface StaffAssignmentsState {
  assignments: StaffAssignment[]
  loading: boolean
  error: Error | null
  fetchAssignments: (childId?: string, staffId?: string) => Promise<void>
  createAssignment: (assignmentData: Partial<StaffAssignment>) => Promise<StaffAssignment>
  updateAssignment: (id: string, assignmentData: Partial<StaffAssignment>) => Promise<StaffAssignment>
  deleteAssignment: (id: string) => Promise<void>
  bulkAssignToGroup: (groupId: string, staffId: string, assignmentType: StaffAssignment['assignment_type'], startDate?: string) => Promise<{ success: boolean; count: number }>
}

export const useStaffAssignmentsStore = create<StaffAssignmentsState>((set) => ({
  assignments: [],
  loading: false,
  error: null,

  fetchAssignments: async (childId?: string, staffId?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('staff_assignments').select('*')

      if (childId) query = query.eq('child_id', childId)
      if (staffId) query = query.eq('staff_id', staffId)

      query = query.order('start_date', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      
      set({ assignments: data || [] })
    } catch (e: any) {
      console.error('Error fetching staff assignments:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createAssignment: async (assignmentData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_assignments')
        .insert([assignmentData])
        .select()
        .single()

      if (error) throw error
      return data as StaffAssignment
    } catch (e: any) {
      console.error('Error creating staff assignment:', e)
      throw e
    }
  },

  updateAssignment: async (id, assignmentData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as StaffAssignment
    } catch (e: any) {
      console.error('Error updating staff assignment:', e)
      throw e
    }
  },

  deleteAssignment: async (id) => {
    try {
      const supabase = createClient()
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

  bulkAssignToGroup: async (groupId, staffId, assignmentType, startDate) => {
    try {
      const supabase = createClient()
      
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'active')

      if (childrenError) throw childrenError
      if (!children || children.length === 0) {
        return { success: true, count: 0 }
      }

      const assignmentRecords = children.map(child => ({
        child_id: child.id,
        staff_id: staffId,
        assignment_type: assignmentType,
        start_date: startDate || new Date().toISOString().split('T')[0]
      }))

      const { data, error } = await supabase
        .from('staff_assignments')
        .insert(assignmentRecords)
        .select()

      if (error) throw error
      return { success: true, count: data?.length || 0 }
    } catch (e: any) {
      console.error('Error bulk assigning staff:', e)
      throw e
    }
  }
}))
