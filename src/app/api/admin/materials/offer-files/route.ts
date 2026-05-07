import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createSupabaseClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await admin
      .from('offer_files')
      .insert(body)
      .select('*')
      .single()

    if (error) {
      console.error('offer_files insert error:', error.message, error.code)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('POST offer-files crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
