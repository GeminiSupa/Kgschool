import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { child_id, absence_date, notification_method, notes, notified_by } = body

    if (!child_id || !absence_date || !notified_by) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: child_id, absence_date, notified_by'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Server configuration error: Missing Supabase credentials'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check deadline
    const { data: deadlineMet, error: deadlineError } = await supabaseAdmin
      .rpc('check_informed_absence_deadline', {
        p_absence_date: absence_date,
        p_notification_time: new Date().toISOString()
      })

    if (deadlineError) throw deadlineError

    // Create notification
    const { data, error } = await supabaseAdmin
      .from('absence_notifications')
      .insert([{
        child_id,
        absence_date,
        notified_at: new Date().toISOString(),
        notified_by,
        deadline_met: deadlineMet || false,
        notification_method: notification_method || 'app',
        notes: notes || null
      }])
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (already notified for this date)
      if (error.code === '23505') {
        throw createError({
          statusCode: 400,
          message: 'Absence already notified for this date'
        })
      }
      throw error
    }

    return {
      success: true,
      notification: data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create absence notification'
    })
  }
})
