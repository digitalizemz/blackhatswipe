import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining accents
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace unsafe chars
    .replace(/_+/g, '_')               // collapse consecutive underscores
    .toLowerCase()
}

/** Sanitize only the last segment (filename) of a storage path. */
function sanitizePath(path: string): string {
  const parts    = path.split('/')
  const last     = parts[parts.length - 1]
  parts[parts.length - 1] = sanitizeFileName(last)
  return parts.join('/')
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const admin  = createAdminClient()
  const form   = await request.formData()
  const file   = form.get('file') as File | null
  const bucket = form.get('bucket') as string | null
  const path   = form.get('path') as string | null

  if (!file || !bucket || !path) {
    return Response.json({ error: 'file, bucket and path are required' }, { status: 400 })
  }

  const safePath = sanitizePath(path)
  const bytes    = await file.arrayBuffer()

  const { data, error } = await admin.storage
    .from(bucket)
    .upload(safePath, bytes, { contentType: file.type, upsert: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(data.path)
  return Response.json({ publicUrl, path: data.path })
}
