export type DateKey = string

export function toISODate(d: Date): DateKey {
  return d.toISOString().split('T')[0]
}

export function getLastNDays(n: number, end = new Date()): Array<{ key: DateKey; label: string }> {
  const days: Array<{ key: DateKey; label: string }> = []
  const e = new Date(end)
  e.setHours(12, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(e)
    d.setDate(e.getDate() - i)
    const key = toISODate(d)
    const label = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
    days.push({ key, label })
  }
  return days
}

