import Link from 'next/link'
import Image from 'next/image'
import { signup } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignupPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex bg-black">
      {/* ── Left panel 60% ── */}
      <div className="hidden lg:flex lg:w-[60%] bg-black flex-col p-10">
        {/* Logo */}
        <div className="w-[160px] h-[40px] relative">
          <Image
            src="/logo-dark.png"
            alt="Logo"
            width={160}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Centered brand content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-lg text-center">
            <h1 className="text-white font-bold leading-tight mb-5"
                style={{ fontSize: '40px' }}>
              The #1 Swipe File for Direct Response Marketers
            </h1>
            <p
              className="font-medium tracking-[0.25em] uppercase mb-14"
              style={{ fontSize: '18px', color: '#FACC15' }}
            >
              Spy. Swipe. Scale.
            </p>

            {/* Social proof row */}
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>500+ Offers</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Scaled Creatives</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>Native Spy Tool</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel 40% ── */}
      <div
        className="w-full lg:w-[40%] flex items-center justify-center p-8"
        style={{
          backgroundColor: '#0A0A0A',
          borderLeft: '1px solid #FACC15',
        }}
      >
        <div className="w-full max-w-sm">
          <h2 className="text-white font-semibold mb-1" style={{ fontSize: '28px' }}>
            Create your account
          </h2>
          <p className="text-zinc-500 text-sm mb-8">Start spying. Start scaling.</p>

          <form action={signup} className="space-y-5">
            {params.error && (
              <div className="rounded-md bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-400">
                {params.error}
              </div>
            )}
            {params.message && (
              <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                <span className="shrink-0">✉️</span>
                <p>{params.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-zinc-400 text-sm">
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                className="h-11 bg-[#111111] border-[#27272A] text-white placeholder:text-zinc-600
                           focus-visible:border-[#FACC15] focus-visible:ring-2
                           focus-visible:ring-[#FACC15]/20 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-400 text-sm">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 bg-[#111111] border-[#27272A] text-white placeholder:text-zinc-600
                           focus-visible:border-[#FACC15] focus-visible:ring-2
                           focus-visible:ring-[#FACC15]/20 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-zinc-400 text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={6}
                required
                className="h-11 bg-[#111111] border-[#27272A] text-white placeholder:text-zinc-600
                           focus-visible:border-[#FACC15] focus-visible:ring-2
                           focus-visible:ring-[#FACC15]/20 focus-visible:ring-offset-0"
              />
            </div>

            <button
              type="submit"
              className="w-full font-bold rounded-lg transition-all hover:brightness-110 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              style={{
                backgroundColor: '#FACC15',
                color: '#000000',
                height: '44px',
              }}
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-sm text-zinc-500 text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium transition-all hover:brightness-110 cursor-pointer"
              style={{ color: '#FACC15' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
