export type CsvCell = string | number | boolean | null | undefined

function escapeCell(value: CsvCell, delimiter: string) {
  if (value === null || value === undefined) return ''
  const raw = String(value)
  const mustQuote = raw.includes('"') || raw.includes('\n') || raw.includes('\r') || raw.includes(delimiter)
  const escaped = raw.replaceAll('"', '""')
  return mustQuote ? `"${escaped}"` : escaped
}

export function toCsv(
  rows: CsvCell[][],
  opts?: {
    delimiter?: string
    lineBreak?: '\n' | '\r\n'
    includeBom?: boolean
  },
) {
  const delimiter = opts?.delimiter ?? ';'
  const lb = opts?.lineBreak ?? '\r\n'
  const body = rows.map((r) => r.map((c) => escapeCell(c, delimiter)).join(delimiter)).join(lb) + lb
  const bom = opts?.includeBom ? '\ufeff' : ''
  return bom + body
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

