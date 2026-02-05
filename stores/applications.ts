import { defineStore } from 'pinia'

export interface Application {
  id: string
  kita_id: string
  child_first_name: string
  child_last_name: string
  child_date_of_birth: string
  preferred_start_date: string
  betreuung_hours_type: '25' | '35' | '45' | 'ganztag' | 'halbtag'
  parent_name: string
  parent_email: string
  parent_phone?: string
  address?: any
  priority_kita_ids?: string[]
  status: 'new' | 'under_review' | 'offered' | 'accepted' | 'rejected' | 'withdrawn'
  offered_place_date?: string
  accepted_date?: string
  rejected_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface WaitlistEntry {
  id: string
  application_id: string
  kita_id: string
  group_id?: string
  position: number
  priority_score: number
  notes?: string
  created_at: string
  updated_at: string
}

export const useApplicationsStore = defineStore('applications', {
  state: () => ({
    applications: [] as Application[],
    waitlist: [] as WaitlistEntry[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchApplications(kitaId?: string, status?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('applications').select('*')

        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        }

        if (status) {
          query = query.eq('status', status)
        }

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.applications = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching applications:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchApplicationById(applicationId: string) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error fetching application:', e)
        throw e
      }
    },

    async createApplication(applicationData: Partial<Application>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('applications')
          .insert([applicationData])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error creating application:', e)
        throw e
      }
    },

    async updateApplication(applicationId: string, updates: Partial<Application>) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('applications')
          .update(updates)
          .eq('id', applicationId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating application:', e)
        throw e
      }
    },

    async updateApplicationStatus(applicationId: string, status: Application['status'], reason?: string) {
      const updates: any = { status }
      
      if (status === 'offered') {
        updates.offered_place_date = new Date().toISOString().split('T')[0]
      } else if (status === 'accepted') {
        updates.accepted_date = new Date().toISOString().split('T')[0]
      } else if (status === 'rejected' && reason) {
        updates.rejected_reason = reason
      }

      return this.updateApplication(applicationId, updates)
    },

    async fetchWaitlist(kitaId?: string, groupId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('waitlist').select('*')

        if (kitaId) {
          query = query.eq('kita_id', kitaId)
        }

        if (groupId) {
          query = query.eq('group_id', groupId)
        }

        query = query.order('position', { ascending: true })

        const { data, error } = await query

        if (error) throw error
        this.waitlist = data || []
      } catch (e: any) {
        this.error = e
        console.error('Error fetching waitlist:', e)
      } finally {
        this.loading = false
      }
    },

    async addToWaitlist(waitlistData: Partial<WaitlistEntry>) {
      try {
        const supabase = useSupabaseClient()
        
        // Get current max position for this kita/group
        const { data: existing } = await supabase
          .from('waitlist')
          .select('position')
          .eq('kita_id', waitlistData.kita_id)
          .eq('group_id', waitlistData.group_id || null)
          .order('position', { ascending: false })
          .limit(1)
          .single()

        const nextPosition = existing?.position ? existing.position + 1 : 1

        const { data, error } = await supabase
          .from('waitlist')
          .insert([{
            ...waitlistData,
            position: nextPosition
          }])
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error adding to waitlist:', e)
        throw e
      }
    },

    async updateWaitlistPosition(waitlistId: string, newPosition: number) {
      try {
        const supabase = useSupabaseClient()
        const { data, error } = await supabase
          .from('waitlist')
          .update({ position: newPosition })
          .eq('id', waitlistId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error updating waitlist position:', e)
        throw e
      }
    },

    async removeFromWaitlist(waitlistId: string) {
      try {
        const supabase = useSupabaseClient()
        const { error } = await supabase
          .from('waitlist')
          .delete()
          .eq('id', waitlistId)

        if (error) throw error
      } catch (e: any) {
        console.error('Error removing from waitlist:', e)
        throw e
      }
    }
  }
})
