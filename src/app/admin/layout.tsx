import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import AdminSidebar from '@/components/admin/admin-sidebar'

const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Validate session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Read profile bypassing RLS
  let profile: { plan: string; role: string } | null = null
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('profiles')
      .select('plan, role')
      .eq('id', user.id)
      .single()
    profile = data
  } catch { /* service-role-key missing/invalid — fall through to SUPER_ADMIN_ID check */ }

  const isAdminOrEditor =
    user.id === SUPER_ADMIN_ID ||
    profile?.role === 'admin' ||
    profile?.role === 'editor' ||
    profile?.plan === 'admin' // legacy

  if (!isAdminOrEditor) redirect('/dashboard/offers')

  return (
    <div className="min-h-screen bg-[#000000] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#050505] border-b border-[#1A1A1A] flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-zinc-500">Admin Panel</span>
          <Link
            href="/dashboard/offers"
            className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            ← Back to App
          </Link>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
