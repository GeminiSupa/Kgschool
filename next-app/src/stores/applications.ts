import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Application {
  id: string
  child_first_name: string
  child_last_name: string
  child_date_of_birth: string
  parent_name: string
  parent_email: string
  parent_phone?: string
  preferred_start_date: string
  betreuung_hours_type: string
  status: 'pending' | 'waitlist' | 'accepted' | 'rejected'
  kita_id: string
  created_at: string
}

export interface WaitlistEntry {
  id: string
  application_id: string
  position: number
  priority_score: number
  group_id?: string
  kita_id: string
  created_at: string
}

interface ApplicationsState {
  applications: Application[]
  waitlist: WaitlistEntry[]
  loading: boolean
  error: Error | null
  fetchApplications: (status?: string) => Promise<void>
  fetchWaitlist: () => Promise<void>
  createApplication: (data: Partial<Application>) => Promise<Application>
  updateApplicationStatus: (id: string, status: string) => Promise<void>
  updateWaitlistPriority: (id: string, score: number) => Promise<void>
  updateWaitlistPosition: (id: string, position: number) => Promise<void>
  removeFromWaitlist: (id: string) => Promise<void>
}

export const useApplicationsStore = create<ApplicationsState>((set, get) => ({
  applications: [],
  waitlist: [],
  loading: false,
  error: null,

  fetchApplications: async (status?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('applications').select('*')
      if (status) {
        query = query.eq('status', status)
      }
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ applications: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  fetchWaitlist: async () => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      set({ waitlist: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createApplication: async (data) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data: created, error } = await supabase
        .from('applications')
        .insert([data])
        .select()
        .single()

      if (error) throw error

      set(state => ({
        applications: [created as Application, ...state.applications]
      }))

      return created as Application
    } catch (e: any) {
      set({ error: e })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  updateApplicationStatus: async (id: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      set(state => ({
        applications: state.applications.map(a => a.id === id ? { ...a, status: status as any } : a)
      }))
    } catch (e: any) {
      console.error('Error updating application status:', e)
      throw e
    }
  },

  updateWaitlistPriority: async (id: string, score: number) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('waitlist')
        .update({ priority_score: score })
        .eq('id', id)
      if (error) throw error
      set(state => ({
        waitlist: state.waitlist.map(w => w.id === id ? { ...w, priority_score: score } : w)
      }))
    } catch (e: any) {
      console.error('Error updating priority score:', e)
      throw e
    }
  },

  updateWaitlistPosition: async (id: string, position: number) => {
      try {
          const supabase = createClient()
          const { error } = await supabase
              .from('waitlist')
              .update({ position })
              .eq('id', id)
          if (error) throw error
          set(state => ({
              waitlist: state.waitlist.map(w => w.id === id ? { ...w, position } : w)
          }))
      } catch (e: any) {
          console.error('Error updating waitlist position:', e)
          throw e
      }
  },

  removeFromWaitlist: async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('waitlist').delete().eq('id', id)
      if (error) throw error
      set(state => ({
        waitlist: state.waitlist.filter(w => w.id !== id)
      }))
    } catch (e: any) {
      console.error('Error removing from waitlist:', e)
      throw e
    }
  }
}))
