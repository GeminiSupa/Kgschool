import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const { month, year, fee_types } = await readBody(event)

    if (!month || !year || !fee_types || fee_types.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Month, year, and at least one fee type are required'
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

    // Get all active children
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('id, group_id')
      .eq('status', 'active')

    if (childrenError) throw childrenError
    if (!children || children.length === 0) {
      return { success: true, count: 0, message: 'No active children found' }
    }

    let generatedCount = 0
    const dueDate = new Date(year, month - 1, 15).toISOString().split('T')[0] // 15th of the month

    for (const child of children) {
      if (!child.group_id) {
        console.warn(`Child ${child.id} has no group assigned`)
        continue
      }

      for (const feeType of fee_types) {
        // Check if fee already exists
        const { data: existing } = await supabaseAdmin
          .from('monthly_fees')
          .select('id')
          .eq('child_id', child.id)
          .eq('month', month)
          .eq('year', year)
          .eq('fee_type', feeType)
          .single()

        if (existing) {
          console.log(`Fee already exists for child ${child.id}, month ${month}, year ${year}, type ${feeType}`)
          continue
        }

        // Get current fee config for this group and fee type
        const { data: configData } = await supabaseAdmin
          .rpc('get_current_fee_config', {
            p_group_id: child.group_id,
            p_fee_type: feeType
          })

        if (!configData || configData.length === 0) {
          console.warn(`No fee config found for group ${child.group_id}, fee type ${feeType}`)
          continue
        }

        const config = configData[0]

        // Create fee record
        const { error: insertError } = await supabaseAdmin
          .from('monthly_fees')
          .insert({
            child_id: child.id,
            month,
            year,
            fee_type: feeType,
            amount: config.amount || 0,
            due_date: dueDate,
            status: 'pending'
          })

        if (insertError) {
          console.error(`Error creating fee for child ${child.id}:`, insertError)
          continue
        }

        generatedCount++
      }
    }

    return {
      success: true,
      count: generatedCount,
      message: `Generated ${generatedCount} fee records`
    }
  } catch (error: any) {
    console.error('Error in fees generate endpoint:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to generate fees'
    })
  }
})
