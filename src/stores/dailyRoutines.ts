import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface DailyRoutine {
  id: string
  group_id: string
  routine_name: string
  start_time: string
  end_time?: string
  day_of_week?: number
  description?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DailyRoutinesState {
  dailyRoutines: DailyRoutine[]
  loading: boolean
  error: Error | null
  fetchDailyRoutines: (groupId?: string) => Promise<void>
  createDailyRoutine: (data: Partial<DailyRoutine>) => Promise<DailyRoutine>
  updateDailyRoutine: (id: string, data: Partial<DailyRoutine>) => Promise<DailyRoutine>
  deleteDailyRoutine: (id: string) => Promise<void>
}

export const useDailyRoutinesStore = create<DailyRoutinesState>((set) => ({
  dailyRoutines: [],
  loading: false,
  error: null,

  fetchDailyRoutines: async (groupId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('daily_routines').select('*').eq('is_active', true).order('start_time', { ascending: true })
      if (groupId) query = query.eq('group_id', groupId)
      const { data, error } = await query
      if (error) throw error
      set({ dailyRoutines: data || [] })
    } catch (e: any) { set({ error: e }) } finally { set({ loading: false }) }
  },

  createDailyRoutine: async (routineData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('daily_routines').insert([routineData]).select().single()
      if (error) throw error
      return data as DailyRoutine
    } catch (e: any) { throw e }
  },

  updateDailyRoutine: async (id, routineData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('daily_routines').update(routineData).eq('id', id).select().single()
      if (error) throw error
      return data as DailyRoutine
    } catch (e: any) { throw e }
  },

  deleteDailyRoutine: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('daily_routines').delete().eq('id', id)
      if (error) throw error
    } catch (e: any) { throw e }
  }
}))
