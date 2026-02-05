import { defineStore } from 'pinia'
import { useKita } from '~/composables/useKita'

export interface StaffPayroll {
  id: string
  staff_id: string
  month: number
  year: number
  base_salary: number
  overtime_hours: number
  overtime_rate: number
  overtime_amount: number
  bonuses: number
  deductions: number
  tax_amount: number
  net_salary: number
  status: 'draft' | 'approved' | 'paid'
  paid_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const usePayrollStore = defineStore('payroll', {
  state: () => ({
    payroll: [] as StaffPayroll[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchPayroll(staffId?: string, month?: number, year?: number, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // If kitaId provided or we need to filter by kita, join with organization_members
        const needsKitaFilter = !staffId && (kitaId !== undefined)
        
        let query
        if (needsKitaFilter) {
          // Get user's kita_id if not provided
          let targetKitaId = kitaId
          if (targetKitaId === undefined) {
            const { getUserKitaId } = useKita()
            targetKitaId = await getUserKitaId()
          }
          
          if (targetKitaId) {
            // Get staff IDs that belong to this kita
            const { data: membersData } = await supabase
              .from('organization_members')
              .select('profile_id')
              .eq('kita_id', targetKitaId)
            
            const staffIds = membersData?.map(m => m.profile_id) || []
            
            if (staffIds.length > 0) {
              query = supabase
                .from('staff_payroll')
                .select('*')
                .in('staff_id', staffIds)
            } else {
              // No staff in this kita, return empty
              this.payroll = []
              return
            }
          } else {
            query = supabase.from('staff_payroll').select('*')
          }
        } else {
          query = supabase.from('staff_payroll').select('*')
        }

        if (staffId) {
          query = query.eq('staff_id', staffId)
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
        this.payroll = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching payroll:', e)
      } finally {
        this.loading = false
      }
    },

    async createPayroll(payrollData: Partial<StaffPayroll>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_payroll')
          .insert([payrollData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating payroll:', e)
        throw e
      }
    },

    async updatePayroll(id: string, payrollData: Partial<StaffPayroll>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_payroll')
          .update(payrollData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating payroll:', e)
        throw e
      }
    },

    async markAsPaid(id: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_payroll')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error marking payroll as paid:', e)
        throw e
      }
    }
  }
})
