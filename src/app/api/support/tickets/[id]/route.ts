import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

const admin = createAdminClient()

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: ticket, error } = await admin
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })

  const { data: messages } = await admin
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const { data: feedback } = await admin
    .from('ticket_feedback')
    .select('*')
    .eq('ticket_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return Response.json({ ticket, messages: messages ?? [], feedback })
}
