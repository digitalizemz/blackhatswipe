import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const supabaseAdmin = createSupabaseClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { userId, plan, days } = await request.json()
  if (!userId || !plan) return Response.json({ error: 'userId and plan are required' }, { status: 400 })

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
