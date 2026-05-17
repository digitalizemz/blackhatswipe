import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextResponse } from 'next/server'

const admin = createAdminClient()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const [{ data: ticket, error }, { data: messages }] = await Promise.all([
    admin.from('support_tickets').select('*').eq('id', id).single(),
    admin.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true }),
  ])

  if (error || !ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  return NextResponse.json({ ticket, messages: messages ?? [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status)        update.status        = body.status
  if (body.assigned_to)   update.assigned_to   = body.assigned_to
  if (body.assigned_name) update.assigned_name = body.assigned_name

  const { error } = await admin.from('support_tickets').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // TODO: send email via Resend for status changes

  return NextResponse.json({ success: true })
}
