import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo'
)

export async function POST(request: Request) {
  const { userId, full_name, role } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  // Upsert so the row is created if it doesn't exist yet (e.g. invited-only users)
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      { id: userId, full_name: full_name ?? null, role: role ?? 'user' },
      { onConflict: 'id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
