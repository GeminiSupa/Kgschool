import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface GroupTeachersState {
  assignments: GroupTeacher[]
  loading: boolean
  error: Error | null
  fetchGroupTeachers: (groupId: string, kitaId?: string) => Promise<void>
  fetchTeacherGroups: (teacherId: string) => Promise<any[]>
  assignTeacherToGroup: (assignmentData: Partial<GroupTeacher>) => Promise<GroupTeacher>
  updateAssignment: (id: string, assignmentData: Partial<GroupTeacher>) => Promise<GroupTeacher>
  removeTeacherFromGroup: (id: string) => Promise<void>
  setPrimaryTeacher: (groupId: string, teacherId: string) => Promise<GroupTeacher>
}

export const useGroupTeachersStore = create<GroupTeachersState>((set) => ({
  assignments: [],
  loading: false,
  error: null,

  fetchGroupTeachers: async (groupId: string, kitaId?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('group_teachers')
        .select('*, group:groups(id, kita_id)')
        .eq('group_id', groupId)
        .order('start_date', { ascending: false })

      if (error) throw error

      let assignments = data || []
      if (kitaId && assignments.length > 0) {
        assignments = assignments.filter((a: any) => a.group?.kita_id === kitaId)
      }
      
      set({ assignments: assignments as GroupTeacher[] })
    } catch (e: any) {
      console.error('Error fetching group teachers:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  fetchTeacherGroups: async (teacherId: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('group_teachers')
        .select('*, groups(*)')
        .eq('teacher_id', teacherId)
        .is('end_date', null)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (e: any) {
      console.error('Error fetching teacher groups:', e)
      set({ error: e })
      return []
    } finally {
      set({ loading: false })
    }
  },

  assignTeacherToGroup: async (assignmentData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('group_teachers')
        .insert([assignmentData])
        .select()
        .single()

      if (error) throw error

      if (assignmentData.role === 'primary' && assignmentData.group_id) {
        await supabase
          .from('groups')
          .update({ educator_id: assignmentData.teacher_id })
          .eq('id', assignmentData.group_id)
      }

      return data as GroupTeacher
    } catch (e: any) {
      console.error('Error assigning teacher to group:', e)
      throw e
    }
  },

  updateAssignment: async (id, assignmentData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('group_teachers')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (assignmentData.role === 'primary' && data) {
        await supabase
          .from('groups')
          .update({ educator_id: data.teacher_id })
          .eq('id', data.group_id)
      }

      return data as GroupTeacher
    } catch (e: any) {
      console.error('Error updating group teacher assignment:', e)
      throw e
    }
  },

  removeTeacherFromGroup: async (id: string) => {
    try {
      const supabase = createClient()

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

      if (assignment && assignment.role === 'primary') {
        const { data: otherPrimary } = await supabase
          .from('group_teachers')
          .select('teacher_id')
          .eq('group_id', assignment.group_id)
          .eq('role', 'primary')
          .is('end_date', null)
          .limit(1)
          .single()

        if (otherPrimary) {
          await supabase.from('groups').update({ educator_id: otherPrimary.teacher_id }).eq('id', assignment.group_id)
        } else {
          await supabase.from('groups').update({ educator_id: null }).eq('id', assignment.group_id)
        }
      }
    } catch (e: any) {
      console.error('Error removing teacher from group:', e)
      throw e
    }
  },

  setPrimaryTeacher: async (groupId: string, teacherId: string) => {
    try {
      const supabase = createClient()

      await supabase
        .from('group_teachers')
        .update({ role: 'assistant' })
        .eq('group_id', groupId)
        .eq('role', 'primary')
        .is('end_date', null)

      const { data, error } = await supabase
        .from('group_teachers')
        .update({ role: 'primary' })
        .eq('group_id', groupId)
        .eq('teacher_id', teacherId)
        .is('end_date', null)
        .select()
        .single()

      if (error) throw error

      await supabase.from('groups').update({ educator_id: teacherId }).eq('id', groupId)

      return data as GroupTeacher
    } catch (e: any) {
      console.error('Error setting primary teacher:', e)
      throw e
    }
  }
}))
