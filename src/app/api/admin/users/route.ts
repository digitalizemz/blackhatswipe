import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, phone, plan, role, created_at, plan_changed_at, plan_changed_by')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json(data)
}
