import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'

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

interface MonthlyFeesState {
  fees: MonthlyFee[]
  payments: FeePayment[]
  loading: boolean
  error: Error | null
  fetchFees: (childId?: string, month?: number, year?: number) => Promise<void>
  createFee: (data: Partial<MonthlyFee>) => Promise<MonthlyFee>
  updateFee: (id: string, data: Partial<MonthlyFee>) => Promise<MonthlyFee>
  recordPayment: (data: Partial<FeePayment>) => Promise<FeePayment>
  getTotalPaid: (feeId: string) => Promise<number>
  fetchPayments: (feeId?: string) => Promise<FeePayment[]>
}

export const useMonthlyFeesStore = create<MonthlyFeesState>((set, get) => ({
  fees: [],
  payments: [],
  loading: false,
  error: null,

  fetchFees: async (childId, month, year) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query: any = supabase.from('monthly_fees').select('*')
      if (childId) query = query.eq('child_id', childId)
      if (month) query = query.eq('month', month)
      if (year) query = query.eq('year', year)
      query = query.order('year', { ascending: false }).order('month', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ fees: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createFee: async (feeData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('monthly_fees').insert([feeData]).select().single()
      if (error) throw error
      return data as MonthlyFee
    } catch (e: any) { throw e }
  },

  updateFee: async (id, feeData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('monthly_fees').update(feeData).eq('id', id).select().single()
      if (error) throw error
      return data as MonthlyFee
    } catch (e: any) { throw e }
  },

  recordPayment: async (paymentData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('fee_payments').insert([paymentData]).select().single()
      if (error) throw error

      // Auto-update fee status if fully paid
      const fee = get().fees.find(f => f.id === paymentData.fee_id)
      if (fee) {
        const totalPaid = await get().getTotalPaid(fee.id)
        if (totalPaid >= fee.amount) {
          await get().updateFee(fee.id, { status: 'paid', paid_at: new Date().toISOString() })
        }
      }
      return data as FeePayment
    } catch (e: any) { throw e }
  },

  getTotalPaid: async (feeId) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('fee_payments').select('amount').eq('fee_id', feeId)
      if (error) throw error
      return (data || []).reduce((sum: number, p: any) => sum + p.amount, 0)
    } catch { return 0 }
  },

  fetchPayments: async (feeId) => {
    try {
      const supabase = createClient()
      let query: any = supabase.from('fee_payments').select('*')
      if (feeId) query = query.eq('fee_id', feeId)
      query = query.order('payment_date', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ payments: data || [] })
      return data || []
    } catch (e: any) { throw e }
  }
}))
