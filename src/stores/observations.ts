import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Observation {
  id: string
  child_id: string
  observer_id: string
  observation_date: string
  context?: string
  description: string
  development_area?: string
  // Legacy/compat fields used in some pages.
  title?: string
  observation_type?: string
  content?: string
  areas_of_development?: string[]
  photos: string[]
  videos: string[]
  created_at: string
  updated_at: string
}

interface ObservationsState {
  observations: Observation[]
  loading: boolean
  error: Error | null
  fetchObservations: (childId?: string, date?: string) => Promise<void>
  createObservation: (data: Partial<Observation>) => Promise<Observation>
  updateObservation: (id: string, data: Partial<Observation>) => Promise<Observation>
  deleteObservation: (id: string) => Promise<void>
}

export const useObservationsStore = create<ObservationsState>((set) => ({
  observations: [],
  loading: false,
  error: null,

  fetchObservations: async (childId?: string, date?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('observations').select('*').order('observation_date', { ascending: false })
      if (childId) query = query.eq('child_id', childId)
      if (date) query = query.eq('observation_date', date)
      const { data, error } = await query
      if (error) throw error
      set({ observations: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createObservation: async (observationData) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('observations')
        .insert([{ ...observationData, observer_id: user?.id }])
        .select().single()
      if (error) throw error
      return data as Observation
    } catch (e: any) {
      throw e
    }
  },

  updateObservation: async (id, observationData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('observations').update(observationData).eq('id', id).select().single()
      if (error) throw error
      return data as Observation
    } catch (e: any) {
      throw e
    }
  },

  deleteObservation: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('observations').delete().eq('id', id)
      if (error) throw error
      set(s => ({ observations: s.observations.filter(o => o.id !== id) }))
    } catch (e: any) {
      throw e
    }
  }
}))
