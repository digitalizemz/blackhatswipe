import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

const admin = createAdminClient()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticket_id, message } = await request.json()
  if (!ticket_id || !message?.trim()) {
    return Response.json({ error: 'ticket_id and message are required' }, { status: 400 })
  }

  const { data: ticket } = await admin
    .from('support_tickets')
    .select('user_id, user_email, subject, status')
    .eq('id', ticket_id)
    .single()
  if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })

  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isStaff = profile?.role === 'admin' || profile?.role === 'editor'
  if (!isStaff && ticket.user_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!isStaff && (ticket.status === 'resolved' || ticket.status === 'closed')) {
    return Response.json({ error: 'Ticket is closed' }, { status: 400 })
  }

  const senderName = profile?.full_name || user.email?.split('@')[0] || 'User'

  const { data: msg, error } = await admin
    .from('ticket_messages')
    .insert({
      ticket_id,
      sender_id:   user.id,
      sender_name: senderName,
      sender_role: isStaff ? 'staff' : 'user',
      message:     message.trim(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  await admin.from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticket_id)

  if (isStaff) {
    // TODO: send email via Resend to ticket.user_email — new reply on ticket.subject
    console.log(`[SUPPORT] Staff reply on "${ticket.subject}" → notify ${ticket.user_email}`)
  }

  return Response.json({ message: msg })
}
