/** Page translation key helper: `pages.<route>.<leaf>` */
export function pT(route: string, leaf: string = 'title'): string {
  return `pages.${route}.${leaf}`
}
