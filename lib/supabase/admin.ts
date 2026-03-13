import { createClient } from '@supabase/supabase-js'

// Cliente com service role — usa APENAS em server components
// Ignora RLS para leitura de dados internos do app
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
