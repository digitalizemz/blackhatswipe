import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

const admin = createAdminClient()

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await admin
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ tickets: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, category, priority, description, sender_name } = await request.json()
  if (!subject?.trim() || !description?.trim()) {
    return Response.json({ error: 'subject and description are required' }, { status: 400 })
  }

  const { data: ticket, error: tErr } = await admin
    .from('support_tickets')
    .insert({
      user_id:    user.id,
      user_email: user.email,
      subject:    subject.trim(),
      category:   category || 'General Question',
      priority:   priority || 'normal',
      status:     'open',
    })
    .select()
    .single()

  if (tErr) return Response.json({ error: tErr.message }, { status: 500 })

  await admin.from('ticket_messages').insert({
    ticket_id:   ticket.id,
    sender_id:   user.id,
    sender_name: sender_name || user.email?.split('@')[0] || 'User',
    sender_role: 'user',
    message:     description.trim(),
  })

  // TODO: send email via Resend to admin — new ticket: subject
  console.log(`[SUPPORT] New ticket "${subject}" from ${user.email} → id: ${ticket.id}`)

  return Response.json({ ticket })
}
