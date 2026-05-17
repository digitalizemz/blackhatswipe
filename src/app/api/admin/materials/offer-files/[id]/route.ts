import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const admin = createAdminClient()
    const body = await request.json()
    const { data, error } = await admin
      .from('offer_files')
      .update(body)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('offer_files patch error:', error.message, error.code)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('PATCH offer-file crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const admin = createAdminClient()
    await admin.from('offer_files').delete().eq('id', params.id)
    try { await admin.from('creative_snapshots').delete().eq('creative_id', params.id) } catch { /* table may not exist */ }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('DELETE offer-file crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
