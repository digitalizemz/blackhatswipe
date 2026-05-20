import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import Sidebar from '@/components/dashboard/sidebar'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import { UserProfileProvider } from '@/lib/user-profile-context'
import FreeUserBanner from '@/components/dashboard/free-user-banner'

const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware already blocks unauthenticated access — read user for UI only, no redirect
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  let profile: { plan: string; role: string; full_name: string | null; pro_expires_at?: string | null } | null = null
  if (user) {
    try {
      const adminClient = createAdminClient()
      const { data, error: profileError } = await adminClient
        .from('profiles')
        .select('plan, role, full_name, pro_expires_at')
        .eq('id', user.id)
        .single()
      if (profileError) {
        console.error('[DashboardLayout] profile fetch failed:', profileError.message)
      } else {
        profile = data
      }
    } catch (err) {
      console.error('[DashboardLayout] admin client threw:', err)
    }
  }

  const isSuperAdmin = user?.id === SUPER_ADMIN_ID
  const rawPlan = isSuperAdmin ? 'pro'   : (profile?.plan ?? 'free')
  const role    = isSuperAdmin ? 'admin' : (profile?.role ?? 'user')

  // If pro_expires_at is in the past, treat the plan as free (enforcement without DB write)
  const isExpiredPro =
    rawPlan === 'pro' &&
    role !== 'admin' &&
    role !== 'editor' &&
    !!profile?.pro_expires_at &&
    new Date(profile.pro_expires_at) < new Date()

  const plan = isExpiredPro ? 'free' : rawPlan

  const isFree =
    plan !== 'pro' &&
    plan !== 'admin' &&
    role !== 'admin' &&
    role !== 'editor'

  return (
    <UserProfileProvider plan={plan} role={role}>
      <div className="min-h-screen bg-[#0A0A0A] flex">
        <Sidebar userEmail={user?.email ?? ''} userPlan={plan} userRole={role} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader userEmail={user?.email ?? ''} userPlan={plan} userRole={role} userFullName={profile?.full_name ?? null} />
          {isFree && <FreeUserBanner />}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </UserProfileProvider>
  )
}
