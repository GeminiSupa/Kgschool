import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const billingId = getRouterParam(event, 'id')

    if (!billingId) {
      throw createError({
        statusCode: 400,
        message: 'Billing ID is required'
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

    // Get bill info for notification (optional)
    const { data: billData } = await supabaseAdmin
      .from('monthly_billing')
      .select('child_id, month, year')
      .eq('id', billingId)
      .single()

    // Delete billing items first (cascade should handle this, but being explicit)
    await supabaseAdmin
      .from('lunch_billing_items')
      .delete()
      .eq('billing_id', billingId)

    // Delete the bill
    const { error } = await supabaseAdmin
      .from('monthly_billing')
      .delete()
      .eq('id', billingId)

    if (error) {
      console.error('Delete error:', error)
      throw createError({
        statusCode: 500,
        message: error.message || 'Failed to delete bill'
      })
    }

    // Optionally notify parents (if you want)
    if (billData) {
      const { data: child } = await supabaseAdmin
        .from('children')
        .select('parent_ids')
        .eq('id', billData.child_id)
        .single()

      if (child?.parent_ids && child.parent_ids.length > 0) {
        const notificationMessage = `Billing for ${billData.month}/${billData.year} has been deleted.`
        
        const notifications = child.parent_ids.map((parentId: string) => ({
          user_id: parentId,
          type: 'info',
          title: 'Billing Deleted',
          message: notificationMessage,
          link: '/parent/billing'
        }))

        await supabaseAdmin
          .from('notifications')
          .insert(notifications)
      }
    }

    return {
      success: true,
      message: 'Bill deleted successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete bill'
    })
  }
})
