import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { userId, plan, days } = await request.json()
  if (!userId || !plan) return Response.json({ error: 'userId and plan are required' }, { status: 400 })

  const supabaseAdmin = createAdminClient()

  const updatePayload: Record<string, unknown> = {
    plan,
    plan_changed_at: new Date().toISOString(),
    plan_changed_by: auth.userId,
  }

  if (plan === 'pro' && typeof days === 'number' && days > 0) {
    const { data: current } = await supabaseAdmin
      .from('profiles')
      .select('pro_expires_at')
      .eq('id', userId)
      .single()

    const base =
      current?.pro_expires_at && new Date(current.pro_expires_at) > new Date()
        ? new Date(current.pro_expires_at)
        : new Date()

    base.setDate(base.getDate() + days)
    updatePayload.pro_expires_at = base.toISOString()
  } else if (plan === 'pro') {
    // No days specified → unlimited access, clear any existing expiry
    updatePayload.pro_expires_at = null
  } else if (plan === 'free') {
    updatePayload.pro_expires_at = null
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
