import { createAdminClient } from '@/lib/supabase/admin-client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

  // Free users get basic card display fields only — no sensitive metrics (views, CPM)
  const freeCols = `
    id, file_name, file_url, file_type, creative_status, created_at,
    offers(id, title, niches(name, color), languages(name, flag_emoji), traffic_sources(name))
  `
  const proCols = `
    *,
    offers(id, title, niches(name, color), languages(name, flag_emoji), traffic_sources(name))
  `

  const { data, error } = await supabaseAdmin
    .from('offer_files')
    .select(isFree ? freeCols : proCols)
    .eq('folder_name', '__creatives__')
    .order('created_at', { ascending: false })
    .limit(isFree ? 4 : 300)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ creatives: data ?? [], isFree })
}
