import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { email, full_name, phone, role = 'user', plan = 'free' } = await request.json()
  if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

  const supabaseAdmin = createAdminClient()

  const isProd = process.env.NODE_ENV === 'production'
  const baseUrl = isProd
    ? 'https://www.blackhatswipe.com'
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data:       { full_name: full_name ?? null, phone: phone ?? null },
    redirectTo: `${baseUrl}/set-password`,
  })

  if (error) return Response.json({ error: error.message }, { status: 400 })

  await supabaseAdmin.from('profiles').upsert({
    id:        data.user.id,
    email,
    full_name: full_name ?? null,
    phone:     phone     ?? null,
    role:      role || 'user',
    plan:      plan || 'free',
  })

  return Response.json({ success: true })
}
