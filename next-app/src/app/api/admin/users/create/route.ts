import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient, requireTenantRole } from '@/utils/authz/tenantGuard'

// This endpoint uses the service role key to bypass RLS and create users
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      email, password, full_name, role, phone,
      address, date_of_birth, emergency_contact_name, emergency_contact_phone,
      start_date, qualifications, weekly_hours, contract_type
    } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    // Require requester to be admin and derive tenant from membership (never trust client kita_id).
    const { kitaId } = await requireTenantRole('admin')
    const supabaseAdmin = getAdminClient()

    console.log(`[createUserAPI] Attempting to create user: ${email} for Kita: ${kitaId}`)

    // 1. Double check if user already exists in Auth (to provide better error or handle race)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (!listError) {
      const existing = existingUsers.users.find(u => u.email === email)
      if (existing) {
        console.warn(`[createUserAPI] User already exists in Auth: ${email} (${existing.id})`)
        // If they exist, we might want to check if they have a profile or membership
        // For now, we'll continue and let it fail or handle it via upsert if possible
      }
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      console.error(`[createUserAPI] Auth creation failed for ${email}:`, authError)
      throw authError
    }

    // 2. Insert/Update the profile
    const userId = authData.user.id
    
    // Auth trigger might have created the profile automatically, so we upsert it.
    // We include email as it's a NOT NULL column in the schema.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email, // MUST INCLUDE EMAIL
        full_name,
        role,
        phone,
        default_kita_id: kitaId,
        address,
        date_of_birth: date_of_birth || null,
        emergency_contact_name,
        emergency_contact_phone,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('id, full_name, role, default_kita_id') // Explicit select to avoid schema cache issues with kita_id if any

    if (profileError) {
      console.error(`[createUserAPI] Profile upsert failed for ${userId}:`, profileError)
      // Cleanup auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw profileError
    }

    // 2.5 Insert Employment Details for staff
    if (role !== 'parent') {
      const { error: empError } = await supabaseAdmin
        .from('employment_details')
        .insert({
          profile_id: userId,
          start_date: start_date || null,
          qualifications,
          weekly_hours: weekly_hours ? parseInt(weekly_hours) : null,
          contract_type
        })
      if (empError) console.error("Error creating employment details:", empError)
    }

    // 3. Ensure org membership exists for the new profile in this tenant.
    // The table organization_members uses 'org_role' and specific values.
    const validOrgRole = role === 'admin' ? 'admin' : role === 'parent' ? 'parent' : 'staff'
    
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert(
        {
          profile_id: userId,
          kita_id: kitaId,
          organization_id: (await supabaseAdmin.from('kitas').select('organization_id').eq('id', kitaId).single()).data?.organization_id,
          org_role: validOrgRole,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id, organization_id' }
      )

    if (memberError) {
      console.error(`[createUserAPI] Organization membership failed for ${userId}:`, memberError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw memberError
    }

    // Return success
    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name, role },
      message: 'User created successfully'
    })

  } catch (err: any) {
    console.error('Error in user creation:', err)
    const status = typeof err?.status === 'number' ? err.status : 500
    return NextResponse.json({ success: false, message: err.message }, { status })
  }
}
