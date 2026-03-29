import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface LearningTheme {
  id: string
  group_id?: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  educator_id?: string
  photos: string[]
  activities: string[]
  learning_areas: string[]
  status: 'active' | 'completed' | 'planned'
  created_at: string
  updated_at: string
}

interface LearningThemesState {
  learningThemes: LearningTheme[]
  loading: boolean
  error: Error | null
  fetchLearningThemes: (groupId?: string, status?: string) => Promise<void>
  createLearningTheme: (data: Partial<LearningTheme>) => Promise<LearningTheme>
  updateLearningTheme: (id: string, data: Partial<LearningTheme>) => Promise<LearningTheme>
  deleteLearningTheme: (id: string) => Promise<void>
}

export const useLearningThemesStore = create<LearningThemesState>((set) => ({
  learningThemes: [],
  loading: false,
  error: null,

  fetchLearningThemes: async (groupId, status) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('learning_themes').select('*').order('created_at', { ascending: false })
      if (groupId) query = query.eq('group_id', groupId)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      set({ learningThemes: data || [] })
    } catch (e: any) { set({ error: e }) } finally { set({ loading: false }) }
  },

  createLearningTheme: async (themeData) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('learning_themes').insert([{ ...themeData, educator_id: user?.id }]).select().single()
      if (error) throw error
      return data as LearningTheme
    } catch (e: any) { throw e }
  },

  updateLearningTheme: async (id, themeData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('learning_themes').update(themeData).eq('id', id).select().single()
      if (error) throw error
      return data as LearningTheme
    } catch (e: any) { throw e }
  },

  deleteLearningTheme: async (id) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('learning_themes').delete().eq('id', id)
      if (error) throw error
    } catch (e: any) { throw e }
  }
}))
