import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface DailyReport {
  id: string
  group_id: string
  report_date: string
  educator_id: string
  title: string
  content: string
  activities: string[]
  photos: string[]
  weather?: string
  special_events?: string
  created_at: string
  updated_at: string
}

interface DailyReportsState {
  dailyReports: DailyReport[]
  loading: boolean
  error: Error | null
  fetchDailyReports: (groupId?: string, date?: string) => Promise<void>
  createDailyReport: (data: Partial<DailyReport>) => Promise<DailyReport>
  updateDailyReport: (id: string, data: Partial<DailyReport>) => Promise<DailyReport>
  deleteDailyReport: (id: string) => Promise<void>
}

export const useDailyReportsStore = create<DailyReportsState>((set) => ({
  dailyReports: [],
  loading: false,
  error: null,

  fetchDailyReports: async (groupId?: string, date?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('daily_reports').select('*').order('report_date', { ascending: false })
      if (groupId) query = query.eq('group_id', groupId)
      if (date) query = query.eq('report_date', date)
      const { data, error } = await query
      if (error) throw error
      set({ dailyReports: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createDailyReport: async (reportData) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('daily_reports')
        .insert([{ ...reportData, educator_id: user?.id }])
        .select().single()
      if (error) throw error
      return data as DailyReport
    } catch (e: any) {
      throw e
    }
  },

  updateDailyReport: async (id, reportData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_reports').update(reportData).eq('id', id).select().single()
      if (error) throw error
      return data as DailyReport
    } catch (e: any) {
      throw e
    }
  },

  deleteDailyReport: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('daily_reports').delete().eq('id', id)
      if (error) throw error
      set(s => ({ dailyReports: s.dailyReports.filter(r => r.id !== id) }))
    } catch (e: any) {
      throw e
    }
  }
}))
