import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { item_ids } = body

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: item_ids (array)'
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

    const today = new Date().toISOString().split('T')[0]
    let processedCount = 0

    // Get all items with their billing info
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('lunch_billing_items')
      .select(`
        *,
        monthly_billing!inner(id, child_id, refund_amount)
      `)
      .in('id', item_ids)
      .eq('is_refundable', true)
      .eq('refunded', false)

    if (itemsError) throw itemsError

    // Group by billing_id to update monthly_billing refund_amount
    const billingUpdates = new Map<string, number>()

    for (const item of items || []) {
      // Mark item as refunded
      const { error: updateError } = await supabaseAdmin
        .from('lunch_billing_items')
        .update({
          refunded: true,
          refund_date: today
        })
        .eq('id', item.id)

      if (updateError) {
        console.error(`Error updating item ${item.id}:`, updateError)
        continue
      }

      processedCount++

      // Track refund amount per billing
      const billingId = item.monthly_billing.id
      const currentRefund = billingUpdates.get(billingId) || 0
      billingUpdates.set(billingId, currentRefund + item.meal_price)
    }

    // Update monthly_billing refund_amount for each billing
    for (const [billingId, refundAmount] of billingUpdates.entries()) {
      // Get current refund amount
      const { data: billing } = await supabaseAdmin
        .from('monthly_billing')
        .select('refund_amount')
        .eq('id', billingId)
        .single()

      const newRefundAmount = (billing?.refund_amount || 0) + refundAmount

      await supabaseAdmin
        .from('monthly_billing')
        .update({ refund_amount: newRefundAmount })
        .eq('id', billingId)
    }

    return {
      success: true,
      count: processedCount
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to process refunds'
    })
  }
})
