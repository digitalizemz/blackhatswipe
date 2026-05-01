import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import Sidebar from '@/components/dashboard/sidebar'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import { UserProfileProvider } from '@/lib/user-profile-context'
import FreeUserBanner from '@/components/dashboard/free-user-banner'

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
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('plan, role, full_name')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'
  const role = profile?.role ?? 'user'

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
          <DashboardHeader userEmail={user.email ?? ''} userPlan={plan} userRole={role} />
          {isFree && <FreeUserBanner />}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </UserProfileProvider>
  )
}
