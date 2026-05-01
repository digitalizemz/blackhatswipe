import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { userId, plan } = await request.json()
  if (!userId || !plan) return Response.json({ error: 'userId and plan are required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan,
      plan_changed_at: new Date().toISOString(),
      plan_changed_by: auth.userId,
    })
    .eq('id', userId)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
