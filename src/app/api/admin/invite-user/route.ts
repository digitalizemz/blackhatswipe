import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/require-admin'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { email, full_name, phone } = await request.json()
  if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: full_name ?? null, phone: phone ?? null },
  })

  if (error) return Response.json({ error: error.message }, { status: 400 })

  await supabaseAdmin.from('profiles').upsert({
    id:        data.user.id,
    email,
    full_name: full_name ?? null,
    phone:     phone     ?? null,
    role:      'user',
    plan:      'free',
  })

  return Response.json({ success: true })
}
