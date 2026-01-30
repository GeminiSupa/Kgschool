import { defineStore } from 'pinia'

export interface MonthlyBilling {
  id: string
  child_id: string
  month: number
  year: number
  total_amount: number
  paid_amount: number
  refund_amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  billing_date: string
  due_date: string
  document_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface BillingItem {
  id: string
  billing_id: string
  order_id?: string
  date: string
  meal_price: number
  is_informed_absence: boolean
  is_refundable: boolean
  refunded: boolean
  refund_date?: string
  notes?: string
  created_at: string
}

export const useBillingStore = defineStore('billing', {
  state: () => ({
    bills: [] as MonthlyBilling[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchBills(childId?: string, month?: number, year?: number) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('monthly_billing')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false })

        if (childId) {
          query = query.eq('child_id', childId)
        }
        if (month) {
          query = query.eq('month', month)
        }
        if (year) {
          query = query.eq('year', year)
        }

        const { data, error } = await query

        if (error) throw error
        this.bills = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching bills:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchBillsForParent() {
      // For parents, RLS will automatically filter to their children's bills
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('monthly_billing')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false })

        if (error) throw error
        this.bills = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching parent bills:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchBillById(id: string): Promise<MonthlyBilling | null> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('monthly_billing')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching bill:', e)
        return null
      }
    },

    async fetchBillingItems(billingId: string): Promise<BillingItem[]> {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('lunch_billing_items')
          .select('*')
          .eq('billing_id', billingId)
          .order('date', { ascending: true })

        if (error) throw error
        return data || []
      } catch (e: any) {
        console.error('Error fetching billing items:', e)
        return []
      }
    },

    async updateBillStatus(id: string, status: MonthlyBilling['status'], paidAmount?: number) {
      try {
        const supabase = useSupabaseClient()
        const updateData: any = { status }
        if (paidAmount !== undefined) {
          updateData.paid_amount = paidAmount
        }

        const { data, error } = await supabase
          .from('monthly_billing')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        await this.fetchBills()
        return data
      } catch (e: any) {
        console.error('Error updating bill:', e)
        throw e
      }
    },

    async uploadBillDocument(id: string, documentUrl: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('monthly_billing')
          .update({ document_url: documentUrl })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        await this.fetchBills()
        return data
      } catch (e: any) {
        console.error('Error uploading document:', e)
        throw e
      }
    }
  }
})
