import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { data, error } = await admin
    .from('offer_files')
    .update(body)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  await admin.from('offer_files').delete().eq('id', params.id)
  // best-effort: cascade scraping snapshots
  try { await admin.from('creative_snapshots').delete().eq('creative_id', params.id) } catch { /* table may not exist */ }

  return Response.json({ success: true })
}
