import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

type AdminResult =
  | { userId: string; error?: never; status?: never }
  | { error: string; status: number; userId?: never }

/**
 * Verifies the incoming request comes from a logged-in admin or editor.
 * Use in every /api/admin/* route handler.
 */
export async function requireAdmin(): Promise<AdminResult> {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  // Hardcoded bypass — always allowed regardless of DB/key state
  if (user.id === SUPER_ADMIN_ID) return { userId: user.id }

  let profile: { role: string; plan: string } | null = null
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('profiles')
      .select('role, plan')
      .eq('id', user.id)
      .single()
    profile = data
  } catch { /* key invalid — profile stays null */ }

  const allowed =
    profile?.role === 'admin' ||
    profile?.role === 'editor' ||
    profile?.plan === 'admin' // legacy

  if (!allowed) return { error: 'Forbidden', status: 403 }
  return { userId: user.id }
}
