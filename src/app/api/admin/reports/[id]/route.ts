import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextRequest, NextResponse } from 'next/server'

const admin = createAdminClient()

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await admin
    .from('offer_reports')
    .update({ status: 'resolved' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ report: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await admin
    .from('offer_reports')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
