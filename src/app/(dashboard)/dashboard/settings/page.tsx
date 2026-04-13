import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-zinc-400 text-sm">Manage your account preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Email</span>
              <span className="text-sm text-zinc-200">{user.email}</span>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Full Name</span>
              <span className="text-sm text-zinc-200">
                {profile?.full_name ?? '—'}
              </span>
            </div>
            <Separator className="bg-zinc-800" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Plan</span>
              <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300 capitalize">
                {profile?.plan ?? 'free'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger zone placeholder */}
        <div className="rounded-xl border border-zinc-800 bg-[#111111] p-6">
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4">
            Danger Zone
          </h2>
          <p className="text-sm text-zinc-500">
            Account deletion and data export options will be available here.
          </p>
        </div>
      </div>
    </div>
  )
}
