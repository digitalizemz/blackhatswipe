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

  const page = parseInt((new URL(req.url)).searchParams.get('page') ?? '0')

  // Free users get basic card display fields only — no sensitive metrics (views, CPM)
  const freeCols = `
    id, file_name, file_url, file_type, creative_status, created_at,
    offers(id, title, niches(name, color), languages(name, flag_emoji), traffic_sources(name))
  `
  const proCols = `
    *,
    offers(id, title, niches(name, color), languages(name, flag_emoji), traffic_sources(name))
  `

  let query = supabaseAdmin
    .from('offer_files')
    .select(isFree ? freeCols : proCols)
    .eq('folder_name', '__creatives__')
    .order('created_at', { ascending: false })

  if (isFree) {
    query = query.limit(4)
  } else if (page > 0) {
    query = query.range(page * 50, page * 50 + 49)
  } else {
    query = query.limit(50)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ creatives: data ?? [], isFree })
}
