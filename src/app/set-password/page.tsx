'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(true)
  const [expired,   setExpired]   = useState(false)

  const resolvedRef = useRef(false)

  useEffect(() => {
    function resolve(hasSession: boolean) {
      if (resolvedRef.current) return
      resolvedRef.current = true
      if (hasSession) {
        setChecking(false)
      } else {
        setExpired(true)
        setChecking(false)
      }
    }

    // Check if a session already exists (e.g. user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolve(true)
        return
      }

      // No session yet — the invite token lives in the URL hash.
      // Supabase JS processes the hash automatically and fires onAuthStateChange.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          resolve(true)
          subscription.unsubscribe()
        }
      })

      // Fallback: if no session arrives within 3 s, the link is invalid/expired
      const timeout = setTimeout(() => {
        resolve(false)
        subscription.unsubscribe()
      }, 3000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
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

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-yellow-400 animate-spin" />
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-[420px]">
          <p className="text-center text-xl font-bold text-yellow-400 tracking-tight mb-1">
            ⚡ BLACKHAT SWIPE
          </p>
          <div className="flex justify-center mb-8">
            <span className="block w-10 h-0.5 bg-yellow-400 rounded-full" />
          </div>
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl text-center">
            <h1 className="text-xl font-bold text-white mb-3">Invalid or expired invite link</h1>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              This invite link has expired or has already been used. Ask your admin to send a new one.
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

        <p className="text-center text-xl font-bold text-yellow-400 tracking-tight mb-1">
          ⚡ BLACKHAT SWIPE
        </p>
        <div className="flex justify-center mb-8">
          <span className="block w-10 h-0.5 bg-yellow-400 rounded-full" />
        </div>

        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Create your password</h1>
          <p className="text-sm text-zinc-400 mb-7 leading-relaxed">
            Welcome to BlackHat Swipe. Set a password to secure your account.
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
              {loading ? 'Setting password…' : 'Set Password & Enter →'}
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
