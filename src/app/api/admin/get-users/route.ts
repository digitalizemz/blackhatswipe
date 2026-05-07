import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo'
)

export async function GET() {
  // Fetch auth users (source of truth — only real users appear here)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Fetch all profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, plan')

  // Build a fast lookup map
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  // Merge: auth user is authoritative for id/email/created_at; profile fills the rest
  const users = authData.users
    .map(authUser => {
      const p = profileMap.get(authUser.id)
      return {
        id:         authUser.id,
        email:      authUser.email ?? null,
        full_name:  p?.full_name ?? null,
        phone:      p?.phone     ?? null,
        role:       p?.role      ?? 'user',
        plan:       p?.plan      ?? 'free',
        created_at: authUser.created_at,
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ users })
}
