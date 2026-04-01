import { NextResponse } from 'next/server'
import { getAdminClient } from '@/utils/authz/tenantGuard'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const kitaName = typeof body.kitaName === 'string' ? body.kitaName.trim() : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!kitaName || !fullName || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Create the Organization (Träger)
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({ name: kitaName })
      .select('id')
      .single()

    if (orgError || !orgData) {
      console.error('Error creating Organization:', orgError)
      throw new Error('Failed to create organization umbrella')
    }

    const orgId = orgData.id

    // 2. Create the Kita (Tenant/Location)
    const { data: kitaData, error: kitaError } = await supabaseAdmin
      .from('kitas')
      .insert({ 
        name: kitaName,
        organization_id: orgId 
      })
      .select('id')
      .single()

    if (kitaError || !kitaData) {
      // Rollback organization creation
      await supabaseAdmin.from('organizations').delete().eq('id', orgId)
      console.error('Error creating Kita:', kitaError)
      throw new Error('Failed to create school location')
    }

    const kitaId = kitaData.id

    // 3. Create the user in Auth (confirmed email so they can sign in immediately)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        // Ensures handle_new_user() inserts correct role when profiles.role is taken from metadata
        role: 'admin',
      },
    })

    if (authError || !authData?.user) {
      // Rollback kita and organization creation
      await supabaseAdmin.from('kitas').delete().eq('id', kitaId)
      await supabaseAdmin.from('organizations').delete().eq('id', orgId)
      console.error('Error creating Auth User:', authError)
      const detail =
        authError?.message ||
        (typeof authError === 'object' && authError !== null && 'msg' in authError
          ? String((authError as { msg?: string }).msg)
          : null)
      throw new Error(
        detail ||
          'Failed to create user account. If the message mentions the database, run next-app/sql/fix_handle_new_user.sql in the Supabase SQL editor.',
      )
    }

    const userId = authData.user.id

    // 4. Upsert the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: fullName,
          email,
          role: 'admin',
          phone: phone || null,
          default_kita_id: kitaId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )

    if (profileError) {
      // Rollback everything
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('kitas').delete().eq('id', kitaId)
      await supabaseAdmin.from('organizations').delete().eq('id', orgId)
      console.error('Error creating Profile:', profileError)
      throw new Error(profileError.message || 'Failed to create user profile')
    }

    // 5. Org membership — table uses org_role (not role); match admin user-create upsert
    const { error: memberError } = await supabaseAdmin.from('organization_members').upsert(
      {
        profile_id: userId,
        organization_id: orgId,
        kita_id: kitaId,
        org_role: 'admin',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id, organization_id' },
    )

    if (memberError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      await supabaseAdmin.from('kitas').delete().eq('id', kitaId)
      await supabaseAdmin.from('organizations').delete().eq('id', orgId)
      console.error('Error creating Org Membership:', memberError)
      throw new Error(
        memberError.message ||
          'Failed to link user to organization. Check organization_members columns (org_role vs role).',
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kita and Admin User created successfully',
      kita: { id: kitaId, name: kitaName }
    })

  } catch (err: any) {
    console.error('Error in register-kita:', err)
    const status = typeof err?.status === 'number' ? err.status : 500
    return NextResponse.json({ success: false, message: err.message }, { status })
  }
}
