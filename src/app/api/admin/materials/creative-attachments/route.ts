import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextRequest, NextResponse } from 'next/server'

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(req.url)
    const creativeId = searchParams.get('creative_id')

    if (!creativeId) {
      return NextResponse.json({ error: 'Missing creative_id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('creative_attachments')
      .select('*')
      .eq('creative_id', creativeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('creative_attachments error:', error.message, error.code)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attachments: data ?? [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('GET creative-attachments crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const supabaseAdmin = createAdminClient()
    const form       = await req.formData()
    const file       = form.get('file') as File | null
    const creativeId = form.get('creative_id') as string | null
    const name       = form.get('name') as string | null

    if (!file || !creativeId) {
      return NextResponse.json({ error: 'file and creative_id are required' }, { status: 400 })
    }

    const safeName = name?.trim() || file.name
    const safePath = sanitizeFileName(file.name)
    const path     = `attachments/${creativeId}/${Date.now()}-${safePath}`
    const bytes    = await file.arrayBuffer()

    const { data: upload, error: upErr } = await supabaseAdmin.storage
      .from('offer-assets')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (upErr) {
      console.error('attachment upload error:', upErr.message)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from('offer-assets').getPublicUrl(upload.path)

    const { data, error } = await supabaseAdmin
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

    if (error) {
      console.error('creative_attachments insert error:', error.message, error.code)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST creative-attachments crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
