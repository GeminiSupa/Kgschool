import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    if (!slug) return NextResponse.json({ success: false, message: 'Missing slug' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('kita_sites')
      .select('kita_id, slug, published, config, updated_at')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, site: data })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load site'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

