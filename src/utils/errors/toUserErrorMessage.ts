type AnyErr = unknown

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function getMessage(err: AnyErr): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  if (isRecord(err) && typeof err.message === 'string') return err.message
  return ''
}

function includesAny(haystack: string, needles: string[]) {
  const s = haystack.toLowerCase()
  return needles.some((n) => s.includes(n.toLowerCase()))
}

export function toUserErrorMessage(err: AnyErr, fallback: string) {
  const msg = getMessage(err)

  // Postgres schema mismatch / developer-facing errors -> human-safe copy
  if (includesAny(msg, ['column lunch_menus.kita_id does not exist', 'lunch_menus.kita_id'])) {
    return 'Der Speiseplan ist noch nicht vollständig eingerichtet. Bitte aktualisieren Sie die Datenbank (Schema/Migrationen) oder kontaktieren Sie den Admin.'
  }

  if (includesAny(msg, ['permission denied', 'rls', 'new row violates row-level security'])) {
    return 'Sie haben für diese Aktion keine Berechtigung. Bitte prüfen Sie Ihre Rolle oder kontaktieren Sie den Admin.'
  }

  if (includesAny(msg, ['failed to fetch', 'networkerror', 'network error', 'fetch'])) {
    return 'Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'
  }

  return fallback
}

