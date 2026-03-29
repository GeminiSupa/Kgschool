import { create } from 'zustand'
import { createClient } from '@/utils/supabase/client'
import { getActiveKitaId } from '@/utils/tenant/client'

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

interface AttendanceState {
  attendance: Attendance[]
  absenceSubmissions: AbsenceSubmission[]
  loading: boolean
  error: Error | null
  fetchAttendance: (childId?: string, date?: string, kitaId?: string) => Promise<void>
  markAttendance: (attendanceData: Partial<Attendance>) => Promise<Attendance>
  markBulkAttendance: (childIds: string[], date: string, status: 'present' | 'absent') => Promise<Attendance[]>
  checkIn: (childId: string, date: string) => Promise<Attendance>
  checkOut: (childId: string, date: string) => Promise<Attendance>
  createAbsenceSubmission: (attendanceId: string, reason: string, notes?: string) => Promise<AbsenceSubmission>
  fetchAbsenceSubmissions: (attendanceId?: string) => Promise<AbsenceSubmission[]>
  markAbsentWithSubmission: (childId: string, date: string, reason: string, notes?: string) => Promise<Attendance>
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  absenceSubmissions: [],
  loading: false,
  error: null,

  fetchAttendance: async (childId?: string, date?: string, kitaId?: string) => {
    set({ loading: true, error: null })
    try {
      const supabase = createClient()
      const resolvedKitaId = kitaId ?? (await getActiveKitaId())
      let query: any

      if (!childId) {
        query = supabase.from('attendance').select('*, children!inner(kita_id)')
        if (resolvedKitaId) query = query.eq('children.kita_id', resolvedKitaId)
      } else {
        // Child-specific fetch: RLS should still enforce membership, but we also keep the query simple.
        query = supabase.from('attendance').select('*')
      }

      if (childId) query = query.eq('child_id', childId)
      if (date) query = query.eq('date', date)
      query = query.order('date', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      const attendance = (data || []).map((item: any) => {
        const { children, ...rest } = item
        return rest
      })
      set({ attendance })
    } catch (e: any) {
      console.error('Error fetching attendance:', e)
      set({ error: e })
    } finally {
      set({ loading: false })
    }
  },

  markAttendance: async (attendanceData) => {
    try {
      const supabase = createClient()
      const dataToInsert: any = { ...attendanceData, check_in_method: 'manual' }

      const { data, error } = await supabase
        .from('attendance')
        .upsert(dataToInsert, { onConflict: 'child_id,date' })
        .select()
        .single()

      if (error && (error.message?.includes('check_in_method') || error.message?.includes('recorded_by'))) {
        const fallback: any = { ...attendanceData }
        delete fallback.recorded_by
        delete fallback.check_in_method
        const { data: d2, error: e2 } = await supabase
          .from('attendance').upsert(fallback, { onConflict: 'child_id,date' }).select().single()
        if (e2) throw e2
        return d2 as Attendance
      }

      if (error) throw error
      return data as Attendance
    } catch (e: any) {
      console.error('Error marking attendance:', e)
      throw e
    }
  },

  markBulkAttendance: async (childIds, date, status) => {
    try {
      const supabase = createClient()
      const records = childIds.map(childId => ({
        child_id: childId,
        date,
        status,
        check_in_time: status === 'present' ? new Date().toISOString() : null,
        check_in_method: 'bulk'
      }))

      const { data, error } = await supabase
        .from('attendance').upsert(records, { onConflict: 'child_id,date' }).select()
      if (error) throw error
      return data as Attendance[]
    } catch (e: any) {
      console.error('Error marking bulk attendance:', e)
      throw e
    }
  },

  checkIn: async (childId, date) => {
    try {
      const supabase = createClient()
      const record: any = {
        child_id: childId, date, status: 'present',
        check_in_time: new Date().toISOString(), check_in_method: 'check_in_out'
      }

      const { data, error } = await supabase
        .from('attendance').upsert(record, { onConflict: 'child_id,date' }).select().single()

      if (error && (error.message?.includes('check_in_method') || error.message?.includes('recorded_by'))) {
        const fallback: any = { child_id: childId, date, status: 'present', check_in_time: new Date().toISOString() }
        const { data: d2, error: e2 } = await supabase
          .from('attendance').upsert(fallback, { onConflict: 'child_id,date' }).select().single()
        if (e2) throw e2
        return d2 as Attendance
      }

      if (error) throw error
      return data as Attendance
    } catch (e: any) {
      console.error('Error checking in:', e)
      throw e
    }
  },

  checkOut: async (childId, date) => {
    try {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('attendance').select('*').eq('child_id', childId).eq('date', date).single()

      if (!existing) throw new Error('No check-in record found')

      const { data, error } = await supabase
        .from('attendance').update({ check_out_time: new Date().toISOString() }).eq('id', existing.id).select().single()
      if (error) throw error
      return data as Attendance
    } catch (e: any) {
      console.error('Error checking out:', e)
      throw e
    }
  },

  createAbsenceSubmission: async (attendanceId, reason, notes) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('absence_submissions')
        .insert([{ attendance_id: attendanceId, submitted_by: user?.id, reason, notes }])
        .select().single()
      if (error) throw error

      await supabase.from('attendance').update({ absence_submission_id: data.id }).eq('id', attendanceId)
      return data as AbsenceSubmission
    } catch (e: any) {
      console.error('Error creating absence submission:', e)
      throw e
    }
  },

  fetchAbsenceSubmissions: async (attendanceId) => {
    try {
      const supabase = createClient()
      let query = supabase.from('absence_submissions').select('*')
      if (attendanceId) query = query.eq('attendance_id', attendanceId)
      query = query.order('submitted_at', { ascending: false })
      const { data, error } = await query
      if (error) throw error
      set({ absenceSubmissions: data || [] })
      return data || []
    } catch (e: any) {
      console.error('Error fetching absence submissions:', e)
      throw e
    }
  },

  markAbsentWithSubmission: async (childId, date, reason, notes) => {
    try {
      const { markAttendance, createAbsenceSubmission } = get()
      const attendanceData = await markAttendance({ child_id: childId, date, status: 'absent' })
      if (attendanceData?.id) await createAbsenceSubmission(attendanceData.id, reason, notes)
      return attendanceData
    } catch (e: any) {
      console.error('Error marking absent with submission:', e)
      throw e
    }
  }
}))
