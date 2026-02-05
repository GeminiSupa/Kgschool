import { defineStore } from 'pinia'
import { useKita } from '~/composables/useKita'

export interface LunchPricing {
  id: string
  group_id: string
  price_per_meal: number
  effective_from: string
  effective_to?: string
  created_at: string
  updated_at: string
}

export const useLunchPricingStore = defineStore('lunchPricing', {
  state: () => ({
    pricing: [] as LunchPricing[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchPricing(kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // If kitaId provided or we need to filter by kita, join with groups
        const needsKitaFilter = kitaId !== undefined
        
        let query
        if (needsKitaFilter) {
          // Join with groups to filter by kita_id
          query = supabase
            .from('lunch_pricing')
            .select('*, groups!inner(kita_id)')
          
          // Get user's kita_id if not provided
          let targetKitaId = kitaId
          if (targetKitaId === undefined) {
            const { getUserKitaId } = useKita()
            targetKitaId = await getUserKitaId()
          }
          
          if (targetKitaId) {
            query = query.eq('groups.kita_id', targetKitaId)
          }
        } else {
          // Auto-get kita_id if not provided
          const { getUserKitaId } = useKita()
          const userKitaId = await getUserKitaId()
          
          if (userKitaId) {
            query = supabase
              .from('lunch_pricing')
              .select('*, groups!inner(kita_id)')
              .eq('groups.kita_id', userKitaId)
          } else {
            query = supabase.from('lunch_pricing').select('*')
          }
        }

        query = query.order('effective_from', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        
        // Clean up the data structure if we joined with groups
        this.pricing = (data || []).map((item: any) => {
          const { groups, ...pricing } = item
          return pricing
        })
      } catch (e: any) {
        this.error = e
        console.error('Error fetching lunch pricing:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchPricingById(id: string): Promise<LunchPricing | null> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_pricing')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching pricing:', e)
        return null
      }
    },

    async createPricing(pricingData: Partial<LunchPricing>) {
      try {
        const supabase = useSupabaseClient()
        
        // Verify group belongs to user's kita
        if (pricingData.group_id) {
          const { getUserKitaId } = useKita()
          const kitaId = await getUserKitaId()
          
          if (kitaId) {
            const { data: groupData } = await supabase
              .from('groups')
              .select('kita_id')
              .eq('id', pricingData.group_id)
              .single()
            
            if (!groupData || groupData.kita_id !== kitaId) {
              throw new Error('Group does not belong to your Kita')
            }
          }
        }
        
        const { data, error } = await supabase
          .from('lunch_pricing')
          .insert([pricingData])
          .select()
          .single()

        if (error) throw error
        
        // Update groups table for quick reference if this is the current pricing
        if (pricingData.group_id && pricingData.effective_from) {
          const effectiveDate = new Date(pricingData.effective_from)
          const today = new Date()
          if (effectiveDate <= today && (!pricingData.effective_to || new Date(pricingData.effective_to) >= today)) {
            await supabase
              .from('groups')
              .update({ lunch_price_per_meal: pricingData.price_per_meal })
              .eq('id', pricingData.group_id)
          }
        }
        
        await this.fetchPricing()
        return data
      } catch (e: any) {
        console.error('Error creating pricing:', e)
        throw e
      }
    },

    async updatePricing(id: string, pricingData: Partial<LunchPricing>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_pricing')
          .update(pricingData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        await this.fetchPricing()
        return data
      } catch (e: any) {
        console.error('Error updating pricing:', e)
        throw e
      }
    },

    async deletePricing(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('lunch_pricing')
          .delete()
          .eq('id', id)

        if (error) throw error
        await this.fetchPricing()
      } catch (e: any) {
        console.error('Error deleting pricing:', e)
        throw e
      }
    },

    getCurrentPricingForGroup(groupId: string): LunchPricing | null {
      const today = new Date().toISOString().split('T')[0]
      return this.pricing.find(p => 
        p.group_id === groupId &&
        p.effective_from <= today &&
        (p.effective_to === null || p.effective_to >= today)
      ) || null
    }
  }
})
