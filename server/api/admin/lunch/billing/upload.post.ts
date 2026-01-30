import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    const query = getQuery(event)
    const billingId = query.id as string

    if (!billingId) {
      throw createError({
        statusCode: 400,
        message: 'Missing billing ID'
      })
    }

    const file = formData?.find(field => field.name === 'file')
    if (!file) {
      throw createError({
        statusCode: 400,
        message: 'No file provided'
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

    // Upload file to Supabase Storage
    const fileName = `${billingId}/${file.filename || 'document.pdf'}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('billing-documents')
      .upload(fileName, file.data, {
        contentType: file.type || 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // For private buckets, we store the file path (not a public URL)
    // Signed URLs will be generated on-demand when needed
    const filePath = fileName

    // Update billing record with document path
    const { data, error: updateError } = await supabaseAdmin
      .from('monthly_billing')
      .update({ document_url: filePath })
      .eq('id', billingId)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      success: true,
      document_path: filePath,
      billing: data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to upload document'
    })
  }
})
