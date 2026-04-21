import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/sidebar'
import DashboardHeader from '@/components/dashboard/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <Sidebar userEmail={user.email ?? ''} userPlan={profile?.plan ?? 'free'} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userEmail={user.email ?? ''} userPlan={profile?.plan ?? 'free'} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
