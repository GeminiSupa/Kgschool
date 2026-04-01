import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/authz/tenantGuard'

/**
 * Returns the signed-in user's profile + organization_members for client hydration.
 * Uses the service role so RLS cannot block or recurse (42P17) on profiles.
 * Only ever reads rows for auth.getUser().id — never arbitrary ids from the client.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[api/auth/my-profile] profiles:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json(null)
    }

    const { data: members, error: omError } = await admin
      .from('organization_members')
      .select('kita_id')
      .eq('profile_id', user.id)

    if (omError) {
      console.error('[api/auth/my-profile] organization_members:', omError)
      return NextResponse.json({ error: omError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...profile,
      organization_members: members ?? [],
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    const status = message.includes('Service Role') || message.includes('configuration') ? 503 : 500
    console.error('[api/auth/my-profile]', e)
    return NextResponse.json({ error: message }, { status })
  }
}
