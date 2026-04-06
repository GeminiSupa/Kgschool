import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute =
    path === '/login' ||
    path === '/signup' ||
    path === '/register' ||
    path === '/auth/forgot-password' ||
    path === '/auth/callback'
  const isProtected = request.nextUrl.pathname.startsWith('/admin') || 
                      request.nextUrl.pathname.startsWith('/teacher') || 
                      request.nextUrl.pathname.startsWith('/parent') ||
                      request.nextUrl.pathname.startsWith('/kitchen') ||
                      request.nextUrl.pathname.startsWith('/support')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Basic role-based routing (we will enhance this when profile fetching is established later)
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // or determine by role
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
