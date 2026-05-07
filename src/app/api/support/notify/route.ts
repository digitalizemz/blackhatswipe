export async function POST(request: Request) {
  const { type, ticketId, subject, userEmail, staffName } = await request.json()

  // TODO: send email via Resend
  switch (type) {
    case 'new_ticket':
      console.log(`[NOTIFY] New ticket: "${subject}" from ${userEmail} (${ticketId})`)
      break
    case 'staff_reply':
      console.log(`[NOTIFY] Staff reply on "${subject}" → send to ${userEmail}`)
      break
    case 'status_in_progress':
      console.log(`[NOTIFY] Ticket "${subject}" in progress by ${staffName} → send to ${userEmail}`)
      break
    case 'status_resolved':
      console.log(`[NOTIFY] Ticket "${subject}" resolved → send to ${userEmail} (request feedback)`)
      break
  }

  return Response.json({ success: true })
}
