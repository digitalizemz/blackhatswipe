'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-yellow-400 animate-spin" />
    </div>
  )
}

function Logo() {
  return (
    <>
      <p className="text-center text-xl font-bold text-yellow-400 tracking-tight mb-1">
        ⚡ BLACKHAT SWIPE
      </p>
      <div className="flex justify-center mb-8">
        <span className="block w-10 h-0.5 bg-yellow-400 rounded-full" />
      </div>
    </>
  )
}

function ResetPasswordContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(true)
  const [invalid,   setInvalid]   = useState(false)

  const doneRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setInvalid(true)
      setChecking(false)
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (doneRef.current) return
      doneRef.current = true
      if (error) setInvalid(true)
      setChecking(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.replace('/dashboard')
  }

  if (checking) return <Spinner />

  if (invalid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-[420px]">
          <Logo />
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl text-center">
            <h1 className="text-xl font-bold text-white mb-3">Invalid or expired reset link</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              This password reset link has expired or has already been used. Request a new one from the login page.
            </p>
            <Link
              href="/login"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 px-6 rounded-lg text-sm transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <Logo />

        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
            Choose a strong new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                autoFocus
                className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full bg-[#111111] border border-[#1A1A1A] rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Saving…' : 'Save New Password →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 BlackHat Swipe · Built for marketers who play to win
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
