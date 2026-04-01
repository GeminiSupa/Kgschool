/** Shared UI strings merged into `pages.shared.*` (see `sharedFlat.ts`, `sharedErrorsFlat.ts`). */
export function sT(leaf: string): string {
  return `pages.shared.${leaf}`
}

/** Replace `{{key}}` placeholders in translated strings. */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v))
  }
  return s
}
