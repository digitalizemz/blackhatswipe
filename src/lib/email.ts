// TODO: add RESEND_API_KEY to environment variables to enable email notifications

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY not set — skipping email to:', to, '| subject:', subject)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BlackHat Swipe <noreply@blackhatswipe.com>',
      to,
      subject,
      html,
    }),
  })
  return res.json()
}
