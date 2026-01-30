import { defineStore } from 'pinia'

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
    async fetchPricing() {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_pricing')
          .select('*')
          .order('effective_from', { ascending: false })

        if (error) throw error
        this.pricing = data || []
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
