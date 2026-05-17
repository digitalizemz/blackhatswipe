import { createAdminClient } from '@/lib/supabase/admin-client'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, plan')
    .eq('id', user.id)
    .single()

  const isFree = !profile || (
    profile.plan !== 'pro' &&
    profile.plan !== 'admin' &&
    !['admin', 'editor'].includes(profile.role ?? '')
  )

  const { searchParams } = new URL(req.url)
  const winningOnly = searchParams.get('winning') === 'true'
  const scalingOnly = searchParams.get('scaling') === 'true'
  const nicheId     = searchParams.get('niche') ?? ''
  const langId      = searchParams.get('lang') ?? ''
  const trafficId   = searchParams.get('traffic') ?? ''
  const typeId      = searchParams.get('type') ?? ''
  const search      = searchParams.get('search') ?? ''
  const sort        = searchParams.get('sort') ?? 'Latest'

  // Free users get basic card fields only — no offer_files join, no sensitive metrics
  const freeCols = 'id, title, niche_id, status, is_winning, scaling_status, thumbnail_url, created_at, niches(name, color)'
  const proCols  = '*, niches(name, color), languages(name, code, flag_emoji), traffic_sources(name), offer_types(name), offer_files(id, folder_name, cpm_estimated, initial_views)'

  let query = supabaseAdmin
    .from('offers')
    .select(isFree ? freeCols : proCols)
    .eq('status', 'active')

  if (winningOnly) query = query.eq('is_winning', true)
  if (scalingOnly) query = query.eq('scaling_status', 'scaling')
  if (nicheId)     query = query.eq('niche_id', nicheId)
  if (langId)      query = query.eq('language_id', langId)
  if (trafficId)   query = query.eq('traffic_source_id', trafficId)
  if (typeId)      query = query.eq('offer_type_id', typeId)
  if (search)      query = query.ilike('title', `%${search}%`)

  if (sort === 'Most Views') {
    query = query.order('total_views', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (isFree) query = query.limit(3)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ offers: data ?? [], isFree })
}
