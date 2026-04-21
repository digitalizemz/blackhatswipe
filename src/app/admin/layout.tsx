import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
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

  if (!profile || profile.plan !== 'admin') {
    redirect('/dashboard/scaling-now')
  }

  return (
    <div className="min-h-screen bg-[#000000] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#050505] border-b border-[#1A1A1A] flex items-center justify-between px-6 shrink-0">
          <span className="text-sm text-zinc-500">Admin Panel</span>
          <Link
            href="/dashboard/scaling-now"
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
