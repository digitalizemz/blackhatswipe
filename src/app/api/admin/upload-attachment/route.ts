import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining accents
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace every other unsafe char
    .replace(/_+/g, '_')               // collapse consecutive underscores
    .toLowerCase()
}

export async function POST(req: NextRequest) {
  const formData   = await req.formData()
  const file       = formData.get('file') as File | null
  const creativeId = formData.get('creative_id') as string | null

  if (!file || !creativeId) {
    return NextResponse.json({ error: 'file and creative_id are required' }, { status: 400 })
  }

  const bytes    = await file.arrayBuffer()
  const buffer   = Buffer.from(bytes)
  const safeName = sanitizeFileName(file.name)
  const fileName = `attachments/${creativeId}/${Date.now()}_${safeName}`

  const { data: uploadData, error: uploadError } = await supabaseAdmin
    .storage
    .from('offer-assets')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin
    .storage
    .from('offer-assets')
    .getPublicUrl(uploadData.path)

  const { data, error } = await supabaseAdmin
    .from('creative_attachments')
    .insert({
      creative_id: creativeId,
      name:        file.name,   // original name preserved for display
      url:         publicUrl,
      file_type:   file.name.split('.').pop() ?? null,
      file_size:   file.size,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attachment: data })
}
