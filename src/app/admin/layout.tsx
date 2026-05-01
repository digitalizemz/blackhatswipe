import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import AdminSidebar from '@/components/admin/admin-sidebar'

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
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('plan, role')
    .eq('id', user.id)
    .single()

  const isAdminOrEditor =
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
