import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server'

export type AppRole = 'admin' | 'teacher' | 'parent' | 'kitchen' | 'support'

export class AuthzError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new AuthzError('Server configuration error: Missing Supabase credentials', 500)
  }

  return createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type TenantContext = {
  userId: string
  role: AppRole
  kitaId: string
}

async function getUserRole(admin: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<AppRole> {
  const { data, error } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (error || !data?.role) throw new AuthzError('Profile not found', 403)
  return data.role as AppRole
}

async function getUserKitaId(admin: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<string> {
  const { data, error } = await admin
    .from('organization_members')
    .select('kita_id')
    .eq('profile_id', userId)
    .not('kita_id', 'is', null)
    .limit(1)
    .single()

  if (error || !data?.kita_id) throw new AuthzError('Tenant not assigned', 403)
  return data.kita_id as string
}

export async function requireTenantRole(requiredRoles: AppRole | AppRole[]): Promise<TenantContext> {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new AuthzError('Unauthorized', 401)

  const admin = getSupabaseAdmin()
  const role = await getUserRole(admin, user.id)
  if (!roles.includes(role)) throw new AuthzError('Forbidden', 403)

  const kitaId = await getUserKitaId(admin, user.id)
  return { userId: user.id, role, kitaId }
}

export function getAdminClient() {
  return getSupabaseAdmin()
}

