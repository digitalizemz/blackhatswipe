import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

const admin = createAdminClient()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticket_id, rating, comment } = await request.json()
  if (!ticket_id || !rating) {
    return Response.json({ error: 'ticket_id and rating are required' }, { status: 400 })
  }

  const { data: ticket } = await admin
    .from('support_tickets')
    .select('user_id, status')
    .eq('id', ticket_id)
    .single()

  if (!ticket || ticket.user_id !== user.id) {
    return Response.json({ error: 'Ticket not found' }, { status: 404 })
  }
  if (ticket.status !== 'resolved') {
    return Response.json({ error: 'Can only rate resolved tickets' }, { status: 400 })
  }

  const { error } = await admin.from('ticket_feedback').insert({
    ticket_id,
    user_id: user.id,
    rating:  Number(rating),
    comment: comment?.trim() || null,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
