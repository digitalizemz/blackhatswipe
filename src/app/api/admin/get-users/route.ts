import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const supabaseAdmin = createAdminClient()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, plan')

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

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
