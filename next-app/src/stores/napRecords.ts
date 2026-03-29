import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface NapRecord {
  id: string
  child_id: string
  nap_date: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  notes?: string
  recorded_by: string
  created_at: string
}

interface NapRecordsState {
  napRecords: NapRecord[]
  loading: boolean
  error: Error | null
  fetchNapRecords: (childId?: string, date?: string) => Promise<void>
  createNapRecord: (data: Partial<NapRecord>, userId: string) => Promise<NapRecord>
  updateNapRecord: (id: string, data: Partial<NapRecord>) => Promise<NapRecord>
}

export const useNapRecordsStore = create<NapRecordsState>((set, get) => ({
  napRecords: [],
  loading: false,
  error: null,

  fetchNapRecords: async (childId, date) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('nap_records').select('*').order('nap_date', { ascending: false })
      if (childId) query = query.eq('child_id', childId)
      if (date) query = query.eq('nap_date', date)
      const { data, error } = await query
      if (error) throw error
      set({ napRecords: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createNapRecord: async (napData, userId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nap_records')
        .insert([{ ...napData, recorded_by: userId }])
        .select()
        .single()
      if (error) throw error
      return data as NapRecord
    } catch (e: any) { throw e }
  },

  updateNapRecord: async (id, napData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nap_records')
        .update(napData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as NapRecord
    } catch (e: any) { throw e }
  }
}))
