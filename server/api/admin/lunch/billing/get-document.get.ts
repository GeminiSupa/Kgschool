import { createClient } from '@supabase/supabase-js'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { billing_id } = query

    if (!billing_id) {
      throw createError({
        statusCode: 400,
        message: 'Missing billing_id parameter'
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

    // Get authenticated user
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

    // Get user profile to check role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Get billing record to check permissions
    const { data: billing, error: billingError } = await supabaseAdmin
      .from('monthly_billing')
      .select('document_url, child_id, children(parent_ids)')
      .eq('id', billing_id)
      .single()

    if (billingError || !billing) {
      throw createError({
        statusCode: 404,
        message: 'Billing record not found'
      })
    }

    if (!billing.document_url) {
      throw createError({
        statusCode: 404,
        message: 'No document uploaded for this billing'
      })
    }

    // Check permissions: Admin can access all, parents can only access their children's bills
    if (profile?.role !== 'admin') {
      if (profile?.role !== 'parent') {
        throw createError({
          statusCode: 403,
          message: 'Access denied'
        })
      }

      // Check if user is a parent of this child
      const { data: child } = await supabaseAdmin
        .from('children')
        .select('parent_ids')
        .eq('id', billing.child_id)
        .single()

      if (!child || !child.parent_ids || !child.parent_ids.includes(user.id)) {
        throw createError({
          statusCode: 403,
          message: 'Access denied: You can only view documents for your own children'
        })
      }
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('billing-documents')
      .createSignedUrl(billing.document_url, 3600) // 1 hour expiry

    if (signedUrlError) throw signedUrlError

    return {
      success: true,
      signed_url: signedUrlData.signedUrl,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to get document URL'
    })
  }
})
