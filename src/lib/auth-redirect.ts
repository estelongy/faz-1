/**
 * Role-based redirect paths.
 * Tek kaynak: app_metadata.role
 */
export function pathForRole(role: string | null | undefined): string {
  switch (role) {
    case 'admin':  return '/admin'
    case 'clinic': return '/klinik/panel'
    case 'vendor': return '/satici/panel'
    default:       return '/panel'
  }
}
