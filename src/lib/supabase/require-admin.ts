import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

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

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, plan')
    .eq('id', user.id)
    .single()

  const allowed =
    profile?.role === 'admin' ||
    profile?.role === 'editor' ||
    profile?.plan === 'admin' // legacy

  if (!allowed) return { error: 'Forbidden', status: 403 }
  return { userId: user.id }
}
