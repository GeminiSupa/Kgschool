import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { deadline_hours } = body

    if (!deadline_hours || deadline_hours < 1 || deadline_hours > 48) {
      throw createError({
        statusCode: 400,
        message: 'Deadline hours must be between 1 and 48'
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

    const { data, error } = await supabaseAdmin
      .from('billing_config')
      .upsert({
        key: 'informed_absence_deadline_hours',
        value: deadline_hours.toString(),
        description: 'Hours before 8 AM on absence date that parent must notify'
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      config: data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update configuration'
    })
  }
})
