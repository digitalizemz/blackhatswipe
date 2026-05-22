import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now      = new Date().toISOString()

  const { data: expired, error } = await supabase
    .from('profiles')
    .select('id, email, subscription_cancel_at')
    .eq('plan', 'pro')
    .not('subscription_cancel_at', 'is', null)
    .lt('subscription_cancel_at', now)

  if (error) {
    console.error('[cron] error fetching expired:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[cron] found expired subscriptions:', expired?.length ?? 0)

  for (const profile of expired ?? []) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', plan_changed_at: now, subscription_cancel_at: null })
      .eq('id', profile.id)

    console.log('[cron] downgraded expired user:', profile.email)
  }

  return NextResponse.json({
    processed: expired?.length ?? 0,
    timestamp: now,
  })
}
