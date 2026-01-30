import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, full_name, role, phone } = body

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: email, password, full_name, role'
      })
    }

    // Validate role
    const validRoles = ['admin', 'teacher', 'parent', 'kitchen', 'support']
    if (!validRoles.includes(role)) {
      throw createError({
        statusCode: 400,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      })
    }

    // Get service role key from environment
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Server configuration error: Missing Supabase credentials'
      })
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser?.users?.some(u => u.email === email)
    
    if (emailExists) {
      throw createError({
        statusCode: 400,
        message: 'A user with this email already exists'
      })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role
      }
    })

    if (authError) {
      throw createError({
        statusCode: 400,
        message: `Failed to create user: ${authError.message}`
      })
    }

    if (!authData.user) {
      throw createError({
        statusCode: 500,
        message: 'User creation failed: No user data returned'
      })
    }

    // Profile should be created by trigger automatically
    // Wait a moment for trigger to complete, then update with correct data
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Check if profile exists (created by trigger)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    let profileError = null

    if (existingProfile) {
      // Profile exists, update it with correct data
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          email,
          full_name,
          role,
          phone: phone || null
        })
        .eq('id', authData.user.id)
      profileError = error
    } else {
      // Profile doesn't exist (trigger didn't fire), create it
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name,
          role,
          phone: phone || null
        })
      profileError = error
    }

    if (profileError) {
      // If profile creation/update fails, try to delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw createError({
        statusCode: 500,
        message: `Failed to create/update profile: ${profileError.message}`
      })
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create user'
    })
  }
})
