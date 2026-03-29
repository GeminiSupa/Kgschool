import { createBrowserClient, createServerClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const msg = `Supabase environment variables are missing. URL: ${url ? 'set' : 'MISSING'}, Key: ${anonKey ? 'set' : 'MISSING'}. Check your .env.local file.`
    console.error(msg)
    // Throwing a descriptive error helps avoid generic "Failed to fetch" downstream
    throw new Error(msg)
  }

  if (typeof window === 'undefined') {
    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // no-op on server prerender path
        },
      },
    })
  }

  return createBrowserClient(url, anonKey)
}
