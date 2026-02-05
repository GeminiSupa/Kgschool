import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

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

export const useConsentsStore = defineStore('consents', {
  state: () => ({
    consents: [] as Consent[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchConsents(childId?: string, consentType?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('consents').select('*')

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (consentType) {
          query = query.eq('consent_type', consentType)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.consents = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching consents:', e)
      } finally {
        this.loading = false
      }
    },

    async grantConsent(childId: string, consentType: Consent['consent_type'], notes?: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()

        // Check if consent already exists
        const { data: existing } = await supabase
          .from('consents')
          .select('id')
          .eq('child_id', childId)
          .eq('consent_type', consentType)
          .single()

        if (existing) {
          // Update existing consent
          const { data, error } = await supabase
            .from('consents')
            .update({
              granted: true,
              granted_by: authStore.user?.id,
              granted_at: new Date().toISOString(),
              revoked_at: null,
              revoked_by: null,
              notes
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error
          return data
        } else {
          // Create new consent
          const { data, error } = await supabase
            .from('consents')
            .insert([{
              child_id: childId,
              consent_type: consentType,
              granted: true,
              granted_by: authStore.user?.id,
              granted_at: new Date().toISOString(),
              notes
            }])
            .select()
            .single()

          if (error) throw error
          return data
        }
      } catch (e: any) {
        console.error('Error granting consent:', e)
        throw e
      }
    },

    async revokeConsent(childId: string, consentType: Consent['consent_type'], notes?: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()

        const { data, error } = await supabase
          .from('consents')
          .update({
            granted: false,
            revoked_at: new Date().toISOString(),
            revoked_by: authStore.user?.id,
            notes
          })
          .eq('child_id', childId)
          .eq('consent_type', consentType)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error revoking consent:', e)
        throw e
      }
    },

    async getConsentStatus(childId: string, consentType: Consent['consent_type']) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('consents')
          .select('*')
          .eq('child_id', childId)
          .eq('consent_type', consentType)
          .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
        return data || null
      } catch (e: any) {
        console.error('Error getting consent status:', e)
        return null
      }
    }
  }
})
