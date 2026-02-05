import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const { month, year } = await readBody(event)

    if (!month || !year) {
      throw createError({
        statusCode: 400,
        message: 'Month and year are required'
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

    // Get authenticated user to determine kita_id
    const supabase = await serverSupabaseClient(event)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user's kita_id from organization_members
    let userKitaId: string | null = null
    const { data: memberData } = await supabaseAdmin
      .from('organization_members')
      .select('kita_id')
      .eq('profile_id', user.id)
      .not('kita_id', 'is', null)
      .limit(1)
      .single()

    if (memberData) {
      userKitaId = memberData.kita_id
    }

    // Get all staff (teachers, support, kitchen) - filter by kita_id if available
    let staffQuery = supabaseAdmin
      .from('profiles')
      .select('id')
      .in('role', ['teacher', 'support', 'kitchen'])

    // If user belongs to a kita, filter staff by kita_id
    if (userKitaId) {
      const { data: memberIds } = await supabaseAdmin
        .from('organization_members')
        .select('profile_id')
        .eq('kita_id', userKitaId)

      const staffIds = memberIds?.map(m => m.profile_id) || []
      if (staffIds.length > 0) {
        staffQuery = staffQuery.in('id', staffIds)
      } else {
        // No staff in this kita, return empty
        return { success: true, count: 0, message: 'No staff members found in your Kita' }
      }
    }

    const { data: staff, error: staffError } = await staffQuery

    if (staffError) throw staffError
    if (!staff || staff.length === 0) {
      return { success: true, count: 0, message: 'No staff members found' }
    }

    let generatedCount = 0

    for (const s of staff) {
      // Get current salary config
      const { data: configData } = await supabaseAdmin
        .rpc('get_current_salary_config', { p_staff_id: s.id })

      if (!configData || configData.length === 0) {
        console.warn(`No salary config found for staff ${s.id}`)
        continue
      }

      const config = configData[0]

      // Check if payroll already exists
      const { data: existing } = await supabaseAdmin
        .from('staff_payroll')
        .select('id')
        .eq('staff_id', s.id)
        .eq('month', month)
        .eq('year', year)
        .single()

      if (existing) {
        console.log(`Payroll already exists for staff ${s.id}, month ${month}, year ${year}`)
        continue
      }

      // Calculate overtime amount (if hourly rate is set)
      let overtimeAmount = 0
      let overtimeRate = 0
      if (config.hourly_rate) {
        overtimeRate = config.hourly_rate * (config.overtime_multiplier || 1.5)
        // For now, overtime hours would need to be tracked separately
        // This is a placeholder - in a real system, you'd calculate from attendance/work logs
      }

      // Calculate net salary (base + overtime - deductions - tax)
      // For now, deductions and tax are 0, but can be added later
      const netSalary = (config.base_salary || 0) + overtimeAmount

      // Create payroll record
      const { error: insertError } = await supabaseAdmin
        .from('staff_payroll')
        .insert({
          staff_id: s.id,
          month,
          year,
          base_salary: config.base_salary || 0,
          overtime_hours: 0, // Would be calculated from work logs
          overtime_rate: overtimeRate,
          overtime_amount: overtimeAmount,
          bonuses: 0,
          deductions: 0,
          tax_amount: 0,
          net_salary: netSalary,
          status: 'draft'
        })

      if (insertError) {
        console.error(`Error creating payroll for staff ${s.id}:`, insertError)
        continue
      }

      generatedCount++
    }

    return {
      success: true,
      count: generatedCount,
      message: `Generated payroll for ${generatedCount} staff members`
    }
  } catch (error: any) {
    console.error('Error in payroll generate endpoint:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate payroll'
    })
  }
})
