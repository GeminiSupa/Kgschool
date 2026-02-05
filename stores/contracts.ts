import { defineStore } from 'pinia'

export interface ChildContract {
  id: string
  child_id: string
  kita_id: string
  contract_number?: string
  start_date: string
  end_date?: string
  betreuung_hours_type: '25' | '35' | '45' | 'ganztag' | 'halbtag'
  fee_category: 'standard' | 'reduced' | 'waived' | 'subsidized'
  lunch_obligation: boolean
  lunch_billing_type: 'flat_monthly' | 'per_meal' | 'hybrid'
  lunch_flat_rate_amount?: number
  subsidy_type?: 'BuT' | 'BremenPass' | 'Geschwisterrabatt' | 'Landeszuschuss' | 'other'
  subsidy_amount: number
  notes?: string
  status: 'active' | 'suspended' | 'terminated' | 'pending'
  created_at: string
  updated_at: string
}

export const useContractsStore = defineStore('contracts', {
  state: () => ({
    contracts: [] as ChildContract[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchContracts(childId?: string, kitaId?: string, status?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('child_contracts').select('*')

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        query = query.order('start_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.contracts = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching contracts:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchContractById(contractId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('child_contracts')
          .select('*')
          .eq('id', contractId)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching contract:', e)
        throw e
      }
    },

    async createContract(contractData: Partial<ChildContract>) {
      try {
        const supabase = useSupabaseClient()
        
        // Generate contract number if not provided
        if (!contractData.contract_number) {
          const year = new Date().getFullYear()
          const { count } = await supabase
            .from('child_contracts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${year}-01-01`)
          
          contractData.contract_number = `CT-${year}-${String((count || 0) + 1).padStart(4, '0')}`
        }

        const { data, error } = await supabase
          .from('child_contracts')
          .insert([contractData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating contract:', e)
        throw e
      }
    },

    async updateContract(contractId: string, updates: Partial<ChildContract>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('child_contracts')
          .update(updates)
          .eq('id', contractId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating contract:', e)
        throw e
      }
    },

    async terminateContract(contractId: string, endDate: string) {
      return this.updateContract(contractId, {
        status: 'terminated',
        end_date: endDate
      })
    }
  }
})
