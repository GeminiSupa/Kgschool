import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  holiday_type: 'holiday' | 'vacation' | 'closure' | 'training' | 'other'
  is_recurring: boolean
  recurring_pattern: 'yearly' | 'monthly' | 'weekly' | null
  affects_billing: boolean
  affects_attendance: boolean
  kita_id: string | null
  created_by: string
  created_at: string
}

interface CalendarState {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  fetchEvents: (startDate?: string, endDate?: string) => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'created_by'>) => Promise<void>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async (startDate, endDate) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase
        .from('academic_calendar')
        .select('*')
        .order('start_date', { ascending: true })

      if (startDate) {
        query = query.gte('end_date', startDate)
      }
      if (endDate) {
        query = query.lte('start_date', endDate)
      }

      const { data, error } = await query

      if (error) throw error
      set({ events: data as CalendarEvent[], loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addEvent: async (eventData) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('academic_calendar')
        .insert([{ ...eventData, created_by: user.id }])
        .select()
        .single()

      if (error) throw error
      set((state) => ({ 
        events: [...state.events, data as CalendarEvent].sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        ),
        loading: false 
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  updateEvent: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('academic_calendar')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('academic_calendar')
        .delete()
        .eq('id', id)

      if (error) throw error
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        loading: false
      }))
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  }
}))
