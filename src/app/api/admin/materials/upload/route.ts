import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const form = await request.formData()
  const file   = form.get('file') as File | null
  const bucket = form.get('bucket') as string | null
  const path   = form.get('path') as string | null

  if (!file || !bucket || !path) {
    return Response.json({ error: 'file, bucket and path are required' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const { data, error } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(data.path)
  return Response.json({ publicUrl, path: data.path })
}
