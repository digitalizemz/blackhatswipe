import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://lladxcxjmxtrsorvagql.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [offerRes, filesRes] = await Promise.all([
    supabaseAdmin
      .from('offers')
      .select('*, niches(name,color), languages(name,flag_emoji), traffic_sources(name), offer_types(name)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('offer_files')
      .select('*')
      .eq('offer_id', id)
      .order('created_at'),
  ])

  if (offerRes.error) {
    const status = offerRes.error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: offerRes.error.message }, { status })
  }

  return NextResponse.json({
    offer: offerRes.data,
    files: filesRes.data ?? [],
  })
}
