import { defineStore } from 'pinia'

export interface MonthlyFee {
  id: string
  child_id: string
  month: number
  year: number
  fee_type: 'tuition' | 'lunch' | 'activities' | 'other'
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  paid_at?: string
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FeePayment {
  id: string
  fee_id: string
  amount: number
  payment_date: string
  payment_method?: string
  transaction_id?: string
  notes?: string
  created_at: string
}

export const useMonthlyFeesStore = defineStore('monthlyFees', {
  state: () => ({
    fees: [] as MonthlyFee[],
    payments: [] as FeePayment[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchFees(childId?: string, month?: number, year?: number) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('monthly_fees').select('*')

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (month) {
          query = query.eq('month', month)
        }

        if (year) {
          query = query.eq('year', year)
        }

        query = query.order('year', { ascending: false })
          .order('month', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.fees = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching monthly fees:', e)
      } finally {
        this.loading = false
      }
    },

    async createFee(feeData: Partial<MonthlyFee>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('monthly_fees')
          .insert([feeData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating monthly fee:', e)
        throw e
      }
    },

    async updateFee(id: string, feeData: Partial<MonthlyFee>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('monthly_fees')
          .update(feeData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating monthly fee:', e)
        throw e
      }
    },

    async recordPayment(paymentData: Partial<FeePayment>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('fee_payments')
          .insert([paymentData])
          .select()
          .single()

        if (error) throw error

        // Update fee status if fully paid
        const fee = this.fees.find(f => f.id === paymentData.fee_id)
        if (fee) {
          const totalPaid = await this.getTotalPaid(fee.id)
          if (totalPaid >= fee.amount) {
            await this.updateFee(fee.id, {
              status: 'paid',
              paid_at: new Date().toISOString()
            })
          }
        }

        return data
      } catch (e: any) {
        console.error('Error recording payment:', e)
        throw e
      }
    },

    async getTotalPaid(feeId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('fee_payments')
          .select('amount')
          .eq('fee_id', feeId)

        if (error) throw error
        return (data || []).reduce((sum, p) => sum + p.amount, 0)
      } catch (e: any) {
        console.error('Error getting total paid:', e)
        return 0
      }
    },

    async fetchPayments(feeId?: string) {
      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('fee_payments').select('*')

        if (feeId) {
          query = query.eq('fee_id', feeId)
        }

        query = query.order('payment_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.payments = data || []
        return data
      } catch (e: any) {
        console.error('Error fetching fee payments:', e)
        throw e
      }
    }
  }
})
