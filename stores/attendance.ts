import { defineStore } from 'pinia'

export interface Attendance {
  id: string
  child_id: string
  check_in_time?: string
  check_out_time?: string
  date: string
  status: 'present' | 'absent' | 'late' | 'early_pickup'
  notes?: string
  leave_request_id?: string
  absence_submission_id?: string
  created_at: string
}

export interface AbsenceSubmission {
  id: string
  attendance_id: string
  submitted_by: string
  reason: string
  notes?: string
  submitted_at: string
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    attendance: [] as Attendance[],
    absenceSubmissions: [] as AbsenceSubmission[],
    loading: false,
    error: null as Error | null
  }),

  actions: {
    async fetchAttendance(childId?: string, date?: string, kitaId?: string) {
      this.loading = true
      this.error = null

      try {
        const supabase = useSupabaseClient()
        
        // If kitaId provided or we need to filter by kita, join with children
        const needsKitaFilter = !childId && (kitaId !== undefined)
        
        let query
        if (needsKitaFilter) {
          // Join with children to filter by kita_id
          query = supabase
            .from('attendance')
            .select('*, children!inner(kita_id)')
          
          // Get user's kita_id if not provided
          let targetKitaId = kitaId
          if (targetKitaId === undefined) {
            const { getUserKitaId } = useKita()
            targetKitaId = await getUserKitaId()
          }
          
          if (targetKitaId) {
            query = query.eq('children.kita_id', targetKitaId)
          }
        } else {
          query = supabase.from('attendance').select('*')
        }

        if (childId) {
          query = query.eq('child_id', childId)
        }

        if (date) {
          query = query.eq('date', date)
        }

        query = query.order('date', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        
        // Clean up the data structure if we joined with children
        this.attendance = (data || []).map((item: any) => {
          const { children, ...attendance } = item
          return attendance
        })
      } catch (e: any) {
        this.error = e
        console.error('Error fetching attendance:', e)
      } finally {
        this.loading = false
      }
    },

    async markAttendance(attendanceData: Partial<Attendance>) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        // Build data object - start with required fields
        const dataToInsert: any = {
          ...attendanceData
        }
        
        // Try to add optional fields (may not exist in schema)
        // If columns don't exist, Supabase will return an error which we'll handle
        if (authStore.user?.id) {
          dataToInsert.recorded_by = authStore.user.id
        }
        if (attendanceData.check_in_method) {
          dataToInsert.check_in_method = attendanceData.check_in_method
        } else {
          dataToInsert.check_in_method = 'manual'
        }

        const { data, error } = await supabase
          .from('attendance')
          .upsert(dataToInsert, { onConflict: 'child_id,date' })
          .select()
          .single()

        // If error is about missing columns, retry without them
        if (error && (error.message?.includes('check_in_method') || error.message?.includes('recorded_by'))) {
          console.warn('Optional columns not available, retrying without them:', error.message)
          const fallbackData: any = {
            ...attendanceData
          }
          // Remove optional fields
          delete fallbackData.recorded_by
          delete fallbackData.check_in_method
          
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('attendance')
            .upsert(fallbackData, { onConflict: 'child_id,date' })
            .select()
            .single()
            
          if (fallbackError) throw fallbackError
          return fallbackResult
        }

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error marking attendance:', e)
        throw e
      }
    },

    async createAbsenceSubmission(attendanceId: string, reason: string, notes?: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const { data, error } = await supabase
          .from('absence_submissions')
          .insert([{
            attendance_id: attendanceId,
            submitted_by: authStore.user?.id,
            reason,
            notes
          }])
          .select()
          .single()

        if (error) throw error

        // Update attendance record with absence_submission_id
        await supabase
          .from('attendance')
          .update({ absence_submission_id: data.id })
          .eq('id', attendanceId)

        return data
      } catch (e: any) {
        console.error('Error creating absence submission:', e)
        throw e
      }
    },

    async fetchAbsenceSubmissions(attendanceId?: string) {
      try {
        const supabase = useSupabaseClient()
        let query = supabase.from('absence_submissions').select('*')

        if (attendanceId) {
          query = query.eq('attendance_id', attendanceId)
        }

        query = query.order('submitted_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        this.absenceSubmissions = data || []
        return data
      } catch (e: any) {
        console.error('Error fetching absence submissions:', e)
        throw e
      }
    },

    async markAbsentWithSubmission(childId: string, date: string, reason: string, notes?: string) {
      try {
        // First create attendance record
        const attendanceData = await this.markAttendance({
          child_id: childId,
          date,
          status: 'absent'
        })

        // Then create absence submission
        if (attendanceData?.id) {
          await this.createAbsenceSubmission(attendanceData.id, reason, notes)
        }

        return attendanceData
      } catch (e: any) {
        console.error('Error marking absent with submission:', e)
        throw e
      }
    },

    async markBulkAttendance(childIds: string[], date: string, status: 'present' | 'absent') {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        // Build records with optional fields
        const attendanceRecords = childIds.map(childId => ({
          child_id: childId,
          date,
          status,
          check_in_time: status === 'present' ? new Date().toISOString() : null,
          recorded_by: authStore.user?.id,
          check_in_method: 'bulk'
        }))

        const { data, error } = await supabase
          .from('attendance')
          .upsert(attendanceRecords, { onConflict: 'child_id,date' })
          .select()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error marking bulk attendance:', e)
        throw e
      }
    },

    async checkIn(childId: string, date: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        const record: any = {
          child_id: childId,
          date,
          status: 'present',
          check_in_time: new Date().toISOString(),
          recorded_by: authStore.user?.id,
          check_in_method: 'check_in_out'
        }
        
        const { data, error } = await supabase
          .from('attendance')
          .upsert(record, { onConflict: 'child_id,date' })
          .select()
          .single()

        // If error is about missing columns, retry without them
        if (error && (error.message?.includes('check_in_method') || error.message?.includes('recorded_by'))) {
          console.warn('Optional columns not available, retrying without them:', error.message)
          const fallbackRecord: any = {
            child_id: childId,
            date,
            status: 'present',
            check_in_time: new Date().toISOString()
          }
          
          const { data: fallbackResult, error: fallbackError } = await supabase
            .from('attendance')
            .upsert(fallbackRecord, { onConflict: 'child_id,date' })
            .select()
            .single()
            
          if (fallbackError) throw fallbackError
          return fallbackResult
        }

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error checking in:', e)
        throw e
      }
    },

    async checkOut(childId: string, date: string) {
      try {
        const supabase = useSupabaseClient()
        const authStore = useAuthStore()
        
        // First get existing attendance record
        const { data: existing } = await supabase
          .from('attendance')
          .select('*')
          .eq('child_id', childId)
          .eq('date', date)
          .single()

        if (!existing) {
          throw new Error('No check-in record found')
        }

        const { data, error } = await supabase
          .from('attendance')
          .update({
            check_out_time: new Date().toISOString(),
            recorded_by: authStore.user?.id
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (e: any) {
        console.error('Error checking out:', e)
        throw e
      }
    },

    async getAttendanceHistory(childId: string, startDate?: string, endDate?: string) {
      try {
        const supabase = useSupabaseClient()
        let query = supabase
          .from('attendance_logs')
          .select(`
            *,
            attendance:attendance_id (
              child_id,
              date,
              status
            )
          `)
          .eq('attendance.child_id', childId)

        if (startDate) {
          query = query.gte('timestamp', startDate)
        }

        if (endDate) {
          query = query.lte('timestamp', endDate)
        }

        query = query.order('timestamp', { ascending: false })

        const { data, error } = await query

        if (error) throw error
        return data || []
      } catch (e: any) {
        console.error('Error fetching attendance history:', e)
        throw e
      }
    }
  }
})
