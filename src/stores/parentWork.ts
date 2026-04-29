import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'

export interface ParentWorkTask {
  id: string
  title: string
  description?: string
  task_type: 'cleaning' | 'cooking' | 'maintenance' | 'gardening' | 'administration' | 'other'
  hourly_rate: number
  estimated_hours?: number
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  assigned_date?: string
  due_date?: string
  completed_date?: string
  notes?: string
  created_by: string
  kita_id?: string
  created_at: string
  updated_at: string
}

export interface ParentWorkSubmission {
  id: string
  task_id: string
  parent_id: string
  child_id?: string
  hours_worked: number
  work_date: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  approved_by?: string
  approved_at?: string
  payment_amount?: number
  payment_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ParentWorkState {
  tasks: ParentWorkTask[]
  submissions: ParentWorkSubmission[]
  loading: boolean
  error: Error | null
  fetchTasks: (status?: string, assignedTo?: string, kitaId?: string) => Promise<void>
  createTask: (data: Partial<ParentWorkTask>) => Promise<ParentWorkTask>
  fetchSubmissions: (taskId?: string, parentId?: string, kitaId?: string) => Promise<void>
  approveSubmission: (id: string, notes?: string) => Promise<ParentWorkSubmission>
  rejectSubmission: (id: string, reason?: string) => Promise<ParentWorkSubmission>
}

export const useParentWorkStore = create<ParentWorkState>((set) => ({
  tasks: [],
  submissions: [],
  loading: false,
  error: null,

  fetchTasks: async (status, assignedTo, kitaId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase.from('parent_work_tasks').select('*')
      if (kitaId) {
        // Keep tenant isolation while still surfacing legacy tasks that were created
        // before kita_id was persisted.
        if (user?.id) {
          query = query.or(`kita_id.eq.${kitaId},and(kita_id.is.null,created_by.eq.${user.id})`)
        } else {
          query = query.eq('kita_id', kitaId)
        }
      }
      if (status) query = query.eq('status', status)
      if (assignedTo) query = query.eq('assigned_to', assignedTo)
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ tasks: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createTask: async (taskData) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const activeKitaId = await getActiveKitaId()
      const payload = {
        ...taskData,
        created_by: user?.id,
        kita_id: taskData.kita_id ?? activeKitaId ?? undefined,
      }

      if (!payload.kita_id) {
        throw new Error('Keine aktive Kita gefunden. Bitte waehlen Sie zuerst eine Kita aus.')
      }

      const { data, error } = await supabase.from('parent_work_tasks').insert([payload]).select().single()
      if (error) throw error
      return data as ParentWorkTask
    } catch (e: any) { throw e }
  },

  fetchSubmissions: async (taskId, parentId, kitaId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('parent_work_submissions').select('*')
      if (taskId) query = query.eq('task_id', taskId)
      if (parentId) query = query.eq('parent_id', parentId)
      query = query.order('work_date', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ submissions: data || [] })
    } catch (e: any) { set({ error: e }) } finally { set({ loading: false }) }
  },

  approveSubmission: async (id, notes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('parent_work_submissions').update({
          status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id, notes
      }).eq('id', id).select().single()
      if (error) throw error
      return data as ParentWorkSubmission
    } catch (e: any) { throw e }
  },

  rejectSubmission: async (id, reason) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('parent_work_submissions').update({
          status: 'rejected', notes: reason
      }).eq('id', id).select().single()
      if (error) throw error
      return data as ParentWorkSubmission
    } catch (e: any) { throw e }
  }
}))
