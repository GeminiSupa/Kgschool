import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const feeId = getRouterParam(event, 'id')
    const paymentData = await readBody(event)

    if (!feeId) {
      throw createError({
        statusCode: 400,
        message: 'Fee ID is required'
      })
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid payment amount is required'
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

    // Get the fee to verify it exists and get the amount
    const { data: fee, error: feeError } = await supabaseAdmin
      .from('monthly_fees')
      .select('id, child_id, amount, status')
      .eq('id', feeId)
      .single()

    if (feeError || !fee) {
      throw createError({
        statusCode: 404,
        message: 'Fee not found'
      })
    }

    // Get total paid so far
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('fee_payments')
      .select('amount')
      .eq('fee_id', feeId)

    if (paymentsError) throw paymentsError

    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
    const remainingAmount = fee.amount - totalPaid

    if (paymentData.amount > remainingAmount) {
      throw createError({
        statusCode: 400,
        message: `Payment amount exceeds remaining balance. Remaining: €${remainingAmount.toFixed(2)}`
      })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('fee_payments')
      .insert({
        fee_id: feeId,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id,
        notes: paymentData.notes
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    // Check if fee is now fully paid
    const newTotalPaid = totalPaid + paymentData.amount
    if (newTotalPaid >= fee.amount) {
      await supabaseAdmin
        .from('monthly_fees')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentData.payment_method
        })
        .eq('id', feeId)
    }

    return {
      success: true,
      payment,
      message: 'Payment recorded successfully'
    }
  } catch (error: any) {
    console.error('Error in fee payment endpoint:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record payment'
    })
  }
})
