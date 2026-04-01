import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/authz/tenantGuard'

/**
 * Lists children for the signed-in user using the service role (bypasses RLS / 42P17).
 * Staff: filtered by kita after membership check. Parents: rows where they appear in parent_ids.
 */
export async function GET(request: Request) {
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

    // Schema uses default_kita_id (optional kita_id column may not exist in all DBs).
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, default_kita_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[api/kita/children] profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'No profile' }, { status: 403 })
    }

    const url = new URL(request.url)
    const kitaParam = url.searchParams.get('kita_id')
    const resolvedKita =
      (kitaParam && kitaParam.trim()) ||
      (profile.default_kita_id as string | null) ||
      null

    const role = profile.role as string

    if (role === 'parent') {
      const { data, error } = await admin
        .from('children')
        .select('*')
        .contains('parent_ids', [user.id])
        .order('first_name', { ascending: true })

      if (error) {
        console.error('[api/kita/children] parent query:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json(data ?? [])
    }

    if (!resolvedKita) {
      return NextResponse.json({ error: 'No kita_id for this user' }, { status: 400 })
    }

    const { data: membership, error: memError } = await admin
      .from('organization_members')
      .select('kita_id')
      .eq('profile_id', user.id)
      .eq('kita_id', resolvedKita)
      .maybeSingle()

    if (memError) {
      console.error('[api/kita/children] organization_members:', memError)
      return NextResponse.json({ error: memError.message }, { status: 500 })
    }

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await admin
      .from('children')
      .select('*')
      .eq('kita_id', resolvedKita)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('[api/kita/children] children:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    const status = message.includes('Service Role') || message.includes('configuration') ? 503 : 500
    console.error('[api/kita/children]', e)
    return NextResponse.json({ error: message }, { status })
  }
}
