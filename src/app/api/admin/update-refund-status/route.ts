import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'

const supabaseAdmin = createAdminClient()

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { id, status } = await request.json()
  if (!id || !status) return Response.json({ error: 'id and status are required' }, { status: 400 })
  if (!['approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('refund_requests')
    .update({ status })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
