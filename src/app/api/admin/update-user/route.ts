import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/require-admin'

const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { userId, full_name, role } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: full_name ?? null, role: role ?? 'user' })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
