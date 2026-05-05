import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const creativeId = searchParams.get('creative_id')
  if (!creativeId) return Response.json({ error: 'creative_id required' }, { status: 400 })

  const { data, error } = await admin
    .from('creative_attachments')
    .select('*')
    .eq('creative_id', creativeId)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const form = await request.formData()
  const file       = form.get('file') as File | null
  const creativeId = form.get('creative_id') as string | null
  const name       = form.get('name') as string | null

  if (!file || !creativeId) {
    return Response.json({ error: 'file and creative_id are required' }, { status: 400 })
  }

  const safeName = name?.trim() || file.name
  const path     = `attachments/${creativeId}/${Date.now()}-${file.name}`
  const bytes    = await file.arrayBuffer()

  const { data: upload, error: upErr } = await admin.storage
    .from('offer-assets')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (upErr) return Response.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('offer-assets').getPublicUrl(upload.path)

  const { data, error } = await admin
    .from('creative_attachments')
    .insert({
      creative_id: creativeId,
      name:        safeName,
      url:         publicUrl,
      file_type:   file.name.split('.').pop() ?? null,
      file_size:   file.size,
    })
    .select('*')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
