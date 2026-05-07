import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

const admin = createAdminClient()

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await admin
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tickets: data ?? [] })
}
