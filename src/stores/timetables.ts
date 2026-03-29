import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Timetable {
  id: string
  group_id: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  effective_from: string
  effective_to: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface TimetableState {
  timetables: Record<string, Timetable | null>
  loading: boolean
  error: string | null
  fetchTimetable: (groupId: string) => Promise<void>
  updateTimetable: (groupId: string, data: Partial<Timetable>) => Promise<void>
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  timetables: {},
  loading: false,
  error: null,

  fetchTimetable: async (groupId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('billing_timetable')
        .select('*')
        .eq('group_id', groupId)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      set((state) => ({
        timetables: { ...state.timetables, [groupId]: data as Timetable },
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateTimetable: async (groupId, timetableData) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      
      // We either update existing or insert new. 
      // For simplicity in this UI, we'll try to update the latest one OR insert if none exists.
      const current = get().timetables[groupId]
      
      let error
      if (current) {
        const { error: updateError } = await supabase
          .from('billing_timetable')
          .update(timetableData)
          .eq('id', current.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('billing_timetable')
          .insert([{ ...timetableData, group_id: groupId }])
        error = insertError
      }

      if (error) throw error
      
      // Refetch to ensure local state is correct
      await get().fetchTimetable(groupId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  }
}))
