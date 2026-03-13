export type AppRole = 'admin' | 'store_user'

export function normalizeRole(role: string | null | undefined): AppRole {
  const value = (role ?? '').trim().toLowerCase()

  if (value === 'admin' || value === 'fabricante' || value === 'manufacturer') {
    return 'admin'
  }

  if (value === 'store_user' || value === 'loja' || value === 'store') {
    return 'store_user'
  }

  return 'store_user'
}
