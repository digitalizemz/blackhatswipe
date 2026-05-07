import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import Sidebar from '@/components/dashboard/sidebar'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import { UserProfileProvider } from '@/lib/user-profile-context'
import FreeUserBanner from '@/components/dashboard/free-user-banner'

// Hardcoded bypass — if the DB/service-role-key ever fails, this user always gets admin
const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate the session with the anon client (reads the JWT)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read the profile with the admin client so RLS never blocks it
  let profile: { plan: string; role: string; full_name: string | null } | null = null
  try {
    const adminClient = createAdminClient()
    const { data, error: profileError } = await adminClient
      .from('profiles')
      .select('plan, role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[DashboardLayout] ❌ profile fetch failed:', profileError.message)
      console.error('[DashboardLayout]    user.id:', user.id)
    } else {
      profile = data
    }
  } catch (err) {
    console.error('[DashboardLayout] ❌ admin client threw:', err)
  }

  // ── PROFILE DEBUG ──────────────────────────────────────────────────────────
  console.log('=== PROFILE DEBUG ===')
  console.log('user.id         :', user.id)
  console.log('user.email      :', user.email)
  console.log('isSuperAdmin    :', user.id === SUPER_ADMIN_ID)
  console.log('profile (raw)   :', profile)
  console.log('profile.plan    :', profile?.plan ?? '(null)')
  console.log('profile.role    :', profile?.role ?? '(null)')
  console.log('=====================')

  // Hardcoded bypass: super-admin ID always gets admin/pro regardless of DB
  const isSuperAdmin = user.id === SUPER_ADMIN_ID
  const plan = isSuperAdmin ? 'pro'   : (profile?.plan ?? 'free')
  const role = isSuperAdmin ? 'admin' : (profile?.role ?? 'user')

  console.log('[DashboardLayout] resolved → plan:', plan, '| role:', role)

  // Show the free banner only for plain users on the free plan
  const isFree =
    plan !== 'pro' &&
    plan !== 'admin' && // legacy
    role !== 'admin' &&
    role !== 'editor'

  return (
    <UserProfileProvider plan={plan} role={role}>
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <Sidebar userEmail={user.email ?? ''} userPlan={plan} userRole={role} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userEmail={user.email ?? ''} userPlan={plan} userRole={role} userFullName={profile?.full_name ?? null} />
          {isFree && <FreeUserBanner />}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </UserProfileProvider>
  )
}
