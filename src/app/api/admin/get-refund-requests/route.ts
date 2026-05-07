import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

const supabaseAdmin = createAdminClient()

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data, error } = await supabaseAdmin
    .from('refund_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}
