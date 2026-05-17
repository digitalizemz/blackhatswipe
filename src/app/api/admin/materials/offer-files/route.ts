import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const admin = createAdminClient()
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
