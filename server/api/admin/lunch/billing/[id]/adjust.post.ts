import { createClient } from '@supabase/supabase-js'
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const billingId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    const { 
      total_amount, 
      paid_amount, 
      refund_amount, 
      notes,
      notify_parent,
      adjusted_by_user_id // Optional: user ID from frontend
    } = body

    if (!billingId) {
      throw createError({
        statusCode: 400,
        message: 'Billing ID is required'
      })
    }

    if (total_amount === undefined || total_amount === null) {
      throw createError({
        statusCode: 400,
        message: 'Total amount is required'
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

    // Get current bill to find child and parents (for notifications) and store old values for audit
    const { data: currentBill, error: fetchError } = await supabaseAdmin
      .from('monthly_billing')
      .select('child_id, month, year, total_amount, paid_amount, refund_amount, status')
      .eq('id', billingId)
      .single()

    if (fetchError || !currentBill) {
      throw createError({
        statusCode: 404,
        message: 'Bill not found'
      })
    }

    // Store previous values for audit log
    const previousTotal = currentBill.total_amount
    const previousPaid = currentBill.paid_amount
    const previousRefund = currentBill.refund_amount
    const previousStatus = currentBill.status

    const newTotal = parseFloat(total_amount.toString())
    const newPaid = paid_amount ? parseFloat(paid_amount.toString()) : 0
    const newRefund = refund_amount ? parseFloat(refund_amount.toString()) : 0

    // Get the admin user ID from the request (if available via headers or session)
    // For now, we'll use a service account or get from auth
    let adjustedBy = null
    try {
      // Try to get user from auth header if available
      const authHeader = event.headers.get('authorization')
      if (authHeader) {
        // Extract user from token if possible
        // For now, we'll use a placeholder - in production, decode JWT
        adjustedBy = 'system' // This should be the actual admin user ID
      }
    } catch (e) {
      console.warn('Could not extract user from auth header')
    }

    // Update the bill
    const { data, error: updateError } = await supabaseAdmin
      .from('monthly_billing')
      .update({
        total_amount: newTotal,
        paid_amount: newPaid,
        refund_amount: newRefund,
        notes: notes || null
      })
      .eq('id', billingId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw createError({
        statusCode: 500,
        message: updateError.message || 'Failed to update bill'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'Bill not found'
      })
    }

    // Create audit log entry
    // Determine adjustment type
    let adjustmentType = 'amount'
    if (previousTotal !== newTotal) adjustmentType = 'amount'
    else if (previousPaid !== newPaid) adjustmentType = 'payment'
    else if (previousRefund !== newRefund) adjustmentType = 'refund'

    // Get admin user ID from request or query for an admin user
    let adminUserId = adjusted_by_user_id || null
    if (!adminUserId) {
      try {
        // Try to get any admin user as fallback
        const { data: adminUser } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single()
        
        adminUserId = adminUser?.id || null
      } catch (e) {
        console.warn('Could not determine admin user for audit log')
      }
    }

    // Only create audit log if values actually changed and we have a valid user ID
    if ((previousTotal !== newTotal || previousPaid !== newPaid || previousRefund !== newRefund) && adminUserId) {
      try {
        await supabaseAdmin
          .from('billing_audit_log')
          .insert([{
            billing_id: billingId,
            adjusted_by: adminUserId,
            adjustment_type: adjustmentType,
            previous_total_amount: previousTotal,
            new_total_amount: newTotal,
            previous_paid_amount: previousPaid,
            new_paid_amount: newPaid,
            previous_refund_amount: previousRefund,
            new_refund_amount: newRefund,
            previous_status: previousStatus,
            new_status: data.status,
            reason: notes || 'Manual adjustment',
            notes: notes || null
          }])
      } catch (auditError: any) {
        // Log error but don't fail the request
        console.error('Failed to create audit log:', auditError)
      }
    }

    // Notify parents if requested
    if (notify_parent) {
      const { data: child } = await supabaseAdmin
        .from('children')
        .select('parent_ids')
        .eq('id', currentBill.child_id)
        .single()

      if (child?.parent_ids && child.parent_ids.length > 0) {
        const notificationMessage = `Your billing for ${data.month}/${data.year} has been adjusted. New total: €${data.total_amount.toFixed(2)}`
        
        const notifications = child.parent_ids.map((parentId: string) => ({
          user_id: parentId,
          type: 'info',
          title: 'Billing Adjusted',
          message: notificationMessage,
          link: `/parent/billing/${billingId}`
        }))

        await supabaseAdmin
          .from('notifications')
          .insert(notifications)
      }
    }

    return {
      success: true,
      bill: data
    }
  } catch (error: any) {
    console.error('Error in adjust endpoint:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to adjust bill'
    })
  }
})
