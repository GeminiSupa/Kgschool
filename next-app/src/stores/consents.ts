import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

export interface Consent {
  id: string
  child_id: string
  consent_type: 'photo' | 'messaging' | 'emergency_data' | 'third_party_tools' | 'data_processing' | 'publication'
  granted: boolean
  granted_by: string
  granted_at: string
  revoked_at?: string
  revoked_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ConsentsState {
  consents: Consent[]
  loading: boolean
  error: Error | null
  fetchConsents: (childId?: string, consentType?: string) => Promise<void>
  grantConsent: (childId: string, consentType: Consent['consent_type'], notes?: string) => Promise<Consent>
  revokeConsent: (childId: string, consentType: Consent['consent_type'], notes?: string) => Promise<Consent>
}

export const useConsentsStore = create<ConsentsState>((set) => ({
  consents: [],
  loading: false,
  error: null,

  fetchConsents: async (childId, consentType) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('consents').select('*')
      if (childId) query = query.eq('child_id', childId)
      if (consentType) query = query.eq('consent_type', consentType)
      query = query.order('created_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ consents: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  grantConsent: async (childId, consentType, notes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: existing } = await supabase.from('consents').select('id').eq('child_id', childId).eq('consent_type', consentType).single()

      if (existing) {
        const { data, error } = await supabase.from('consents').update({
            granted: true, granted_by: user?.id, granted_at: new Date().toISOString(), revoked_at: null, revoked_by: null, notes
        }).eq('id', existing.id).select().single()
        if (error) throw error
        return data as Consent
      } else {
        const { data, error } = await supabase.from('consents').insert([{
            child_id: childId, consent_type: consentType, granted: true, granted_by: user?.id, granted_at: new Date().toISOString(), notes
        }]).select().single()
        if (error) throw error
        return data as Consent
      }
    } catch (e: any) {
      throw e
    }
  },

  revokeConsent: async (childId, consentType, notes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('consents').update({
          granted: false, revoked_at: new Date().toISOString(), revoked_by: user?.id, notes
      }).eq('child_id', childId).eq('consent_type', consentType).select().single()
      if (error) throw error
      return data as Consent
    } catch (e: any) {
      throw e
    }
  }
}))
