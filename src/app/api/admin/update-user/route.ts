import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo'
)

export async function POST(request: Request) {
  const { userId, email, full_name, phone, role } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

  // Update auth email if changed
  if (email) {
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ ...(email ? { email } : {}), full_name, phone, role })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
