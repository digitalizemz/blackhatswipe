import { createAdminClient } from '@/lib/supabase/admin-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Session check
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Plan check — role and plan come from the profiles table via admin client,
  // never from user.user_metadata which users can write themselves.
  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, role')
    .eq('id', user.id)
    .single()

  const hasAccess = profile && (
    profile.plan === 'pro' ||
    profile.role === 'admin' ||
    profile.role === 'editor'
  )

  if (!hasAccess) return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })

  const { id } = await params

  const [offerRes, filesRes] = await Promise.all([
    supabaseAdmin
      .from('offers')
      .select('*, niches(name,color), languages(name,flag_emoji), traffic_sources(name), offer_types(name)')
      .eq('id', id)
      .single(),
    supabaseAdmin
      .from('offer_files')
      .select('*')
      .eq('offer_id', id)
      .order('created_at'),
  ])

  if (offerRes.error) {
    const status = offerRes.error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: offerRes.error.message }, { status })
  }

  return NextResponse.json({
    offer: offerRes.data,
    files: filesRes.data ?? [],
  })
}
