import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

const FILES: Record<string, string> = {
  manual: 'MANUAL.md',
  presentation: 'PRESENTATION.md',
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const filename = FILES[slug]
  if (!filename) {
    return NextResponse.json({ error: 'Unknown document' }, { status: 404 })
  }

  const path = join(process.cwd(), 'docs', filename)
  if (!existsSync(path)) {
    return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
  }

  const content = readFileSync(path, 'utf-8')
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="kg-school-${slug}.md"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
