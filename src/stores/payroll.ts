import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'

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

interface PayrollState {
  payroll: StaffPayroll[]
  loading: boolean
  error: Error | null
  fetchPayroll: (staffId?: string, month?: number, year?: number, kitaId?: string) => Promise<void>
  createPayroll: (data: Partial<StaffPayroll>) => Promise<StaffPayroll>
  updatePayroll: (id: string, data: Partial<StaffPayroll>) => Promise<StaffPayroll>
  markAsPaid: (id: string) => Promise<StaffPayroll>
}

export const usePayrollStore = create<PayrollState>((set) => ({
  payroll: [],
  loading: false,
  error: null,

  fetchPayroll: async (staffId, month, year, kitaId) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      let query = supabase.from('staff_payroll').select('*')

      if (staffId) {
        query = query.eq('staff_id', staffId)
      } else {
        const resolvedKitaId = kitaId ?? (await getActiveKitaId())
        if (!resolvedKitaId) {
          set({ payroll: [] })
          return
        }
        const { data: members } = await supabase
          .from('organization_members')
          .select('profile_id')
          .eq('kita_id', resolvedKitaId)
        const ids = members?.map(m => m.profile_id) || []
        if (ids.length > 0) {
          query = query.in('staff_id', ids)
        } else {
          set({ payroll: [] })
          return
        }
      }

      if (month) query = query.eq('month', month)
      if (year) query = query.eq('year', year)
      query = query.order('year', { ascending: false }).order('month', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      set({ payroll: data || [] })
    } catch (e: any) {
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  createPayroll: async (payrollData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_payroll')
        .insert([payrollData])
        .select()
        .single()
      if (error) throw error
      return data as StaffPayroll
    } catch (e: any) {
      throw e
    }
  },

  updatePayroll: async (id, payrollData) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_payroll')
        .update(payrollData)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as StaffPayroll
    } catch (e: any) {
      throw e
    }
  },

  markAsPaid: async (id) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff_payroll')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as StaffPayroll
    } catch (e: any) {
      throw e
    }
  }
}))
