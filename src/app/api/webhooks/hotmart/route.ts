import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json()

  console.log('[hotmart webhook] received:', body.event, body.data?.buyer?.email)

  const event = body.event
  const buyer = body.data?.buyer
  const email = buyer?.email?.toLowerCase()
  const name  = buyer?.name

  if (!email) {
    console.error('[hotmart webhook] no email in payload')
    return NextResponse.json({ error: 'No email' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (event === 'PURCHASE_COMPLETE' || event === 'PURCHASE_APPROVED') {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const found = existingUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (found) {
      // User exists — just upgrade plan
      await supabase
        .from('profiles')
        .update({
          plan:            'pro',
          plan_changed_at: new Date().toISOString(),
        })
        .eq('id', found.id)

      console.log('[hotmart webhook] upgraded existing user:', email)
    } else {
      // User does not exist — create account
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password:       tempPassword,
        email_confirm:  true,
        user_metadata:  { full_name: name ?? email.split('@')[0] },
      })

      if (createError || !newUser.user) {
        console.error('[hotmart webhook] create user error:', createError?.message)
        return NextResponse.json({ error: createError?.message }, { status: 500 })
      }

      // Update profile to pro
      await supabase
        .from('profiles')
        .update({
          plan:            'pro',
          plan_changed_at: new Date().toISOString(),
          full_name:       name ?? email.split('@')[0],
        })
        .eq('id', newUser.user.id)

      // Generate password-reset link so the user can set their own password
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type:  'recovery',
        email,
        options: {
          redirectTo: 'https://www.blackhatswipe.com/reset-password',
        },
      })

      if (linkError) {
        console.error('[hotmart webhook] generate link error:', linkError.message)
      } else {
        console.log('[hotmart webhook] password reset link generated for:', email)

        // Send welcome email via Resend
        if (process.env.RESEND_API_KEY && linkData?.properties?.action_link) {
          await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type':  'application/json',
            },
            body: JSON.stringify({
              from:    'BlackHat Swipe <noreply@blackhatswipe.com>',
              to:      email,
              subject: 'Set your BlackHat Swipe password',
              html: `
                <div style="background:#000;padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h1 style="color:#EAB308;font-size:20px">⚡ BLACKHAT SWIPE</h1>
                  <h2 style="color:#fff">Your Pro account is ready!</h2>
                  <p style="color:#aaa">Click the button below to set your password and access the platform.</p>
                  <a href="${linkData.properties.action_link}"
                     style="display:inline-block;background:#EAB308;color:#000;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;margin:20px 0">
                    🔐 Set My Password
                  </a>
                  <p style="color:#666;font-size:13px">This link expires in 24 hours.</p>
                  <p style="color:#666;font-size:13px">After setting your password, log in at: <a href="https://www.blackhatswipe.com/login" style="color:#EAB308">blackhatswipe.com/login</a></p>
                  <hr style="border-color:#222;margin:24px 0">
                  <p style="color:#666;font-size:12px">Need help? WhatsApp: +258 871 252 278</p>
                </div>
              `,
            }),
          })
        }
      }

      console.log('[hotmart webhook] created new Pro user:', email)
    }
  }

  if (
    event === 'PURCHASE_CANCELED' ||
    event === 'PURCHASE_REFUNDED'  ||
    event === 'PURCHASE_CHARGEBACK'
  ) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const found = existingUsers?.users?.find(u => u.email?.toLowerCase() === email)

    if (found) {
      await supabase
        .from('profiles')
        .update({ plan: 'free', plan_changed_at: new Date().toISOString() })
        .eq('id', found.id)

      console.log('[hotmart webhook] downgraded user to free:', email)
    }
  }

  return NextResponse.json({ received: true })
}
