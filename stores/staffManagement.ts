import { defineStore } from 'pinia'

export interface StaffQualification {
  id: string
  staff_id: string
  qualification_type: 'Erzieher' | 'Kinderpfleger' | 'Heilpädagoge' | 'Fachkraft' | 'Praktikant' | 'other'
  certificate_number?: string
  issued_date?: string
  expiry_date?: string
  issuing_authority?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface StaffSchedule {
  id: string
  staff_id: string
  kita_id: string
  employment_type: 'vollzeit' | 'teilzeit' | 'minijob'
  weekly_hours: number
  start_date: string
  end_date?: string
  group_assignments?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface StaffRota {
  id: string
  staff_id: string
  group_id: string
  date: string
  start_time?: string
  end_time?: string
  is_absence: boolean
  absence_type?: 'sick' | 'vacation' | 'training' | 'other'
  replacement_staff_id?: string
  notes?: string
  created_at: string
}

export interface CareRatio {
  id: string
  group_id: string
  date: string
  staff_count: number
  child_count: number
  ratio: number
  target_ratio?: number
  notes?: string
  created_at: string
}

export const useStaffManagementStore = defineStore('staffManagement', {
  state: () => ({
    qualifications: [] as StaffQualification[],
    schedules: [] as StaffSchedule[],
    rota: [] as StaffRota[],
    careRatios: [] as CareRatio[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    // Qualifications
    async fetchQualifications(staffId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('staff_qualifications').select('*')

        if (staffId) {
          query = query.eq('staff_id', staffId)
        }

        query = query.order('issued_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.qualifications = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching qualifications:', e)
      } finally {
        this.loading = false
      }
    },

    async createQualification(qualificationData: Partial<StaffQualification>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_qualifications')
          .insert([qualificationData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating qualification:', e)
        throw e
      }
    },

    async updateQualification(qualificationId: string, updates: Partial<StaffQualification>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_qualifications')
          .update(updates)
          .eq('id', qualificationId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating qualification:', e)
        throw e
      }
    },

    async deleteQualification(qualificationId: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('staff_qualifications')
          .delete()
          .eq('id', qualificationId)

        if (error) throw error
      } catch (e: any) {
        console.error('Error deleting qualification:', e)
        throw e
      }
    },

    // Schedules
    async fetchSchedules(staffId?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('staff_schedules').select('*')

        if (staffId) {
          query = query.eq('staff_id', staffId)
        }

        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        }

        query = query.order('start_date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.schedules = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching schedules:', e)
      } finally {
        this.loading = false
      }
    },

    async createSchedule(scheduleData: Partial<StaffSchedule>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_schedules')
          .insert([scheduleData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating schedule:', e)
        throw e
      }
    },

    // Rota
    async fetchRota(groupId?: string, date?: string, startDate?: string, endDate?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('staff_rota').select('*')

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        if (date) {
          query = query.eq('date', date)
        }

        if (startDate) {
          query = query.gte('date', startDate)
        }

        if (endDate) {
          query = query.lte('date', endDate)
        }

        query = query.order('date', { ascending: true })

        const { data, error } = await query

        if (error) throw error
        this.rota = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching rota:', e)
      } finally {
        this.loading = false
      }
    },

    async createRotaEntry(rotaData: Partial<StaffRota>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_rota')
          .insert([rotaData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating rota entry:', e)
        throw e
      }
    },

    async updateRotaEntry(rotaId: string, updates: Partial<StaffRota>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('staff_rota')
          .update(updates)
          .eq('id', rotaId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating rota entry:', e)
        throw e
      }
    },

    // Care Ratios
    async fetchCareRatios(groupId?: string, date?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('care_ratios').select('*')

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        if (date) {
          query = query.eq('date', date)
        }

        query = query.order('date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.careRatios = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching care ratios:', e)
      } finally {
        this.loading = false
      }
    },

    async createCareRatio(ratioData: Partial<CareRatio>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('care_ratios')
          .insert([ratioData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating care ratio:', e)
        throw e
      }
    }
  }
})
