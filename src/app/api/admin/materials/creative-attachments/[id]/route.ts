import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createSupabaseClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await admin
      .from('creative_attachments')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('creative_attachments delete error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('DELETE creative-attachment crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
