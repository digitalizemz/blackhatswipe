'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { login } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'h-11 bg-[#111111] border-[#27272A] text-white placeholder:text-zinc-600 ' +
  'focus-visible:border-[#FACC15] focus-visible:ring-2 ' +
  'focus-visible:ring-[#FACC15]/20 focus-visible:ring-offset-0'

const primaryBtn =
  'w-full font-bold rounded-lg transition-all hover:brightness-110 cursor-pointer ' +
  'disabled:opacity-70 disabled:cursor-wait h-11'

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Login submit button (uses form pending state) ────────────────────────────

function LoginSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={primaryBtn}
      style={{ backgroundColor: '#FACC15', color: '#000' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner /> Signing in…
        </span>
      ) : 'Sign In'}
    </button>
  )
}

// ─── VIEW 1: Login form ───────────────────────────────────────────────────────

function LoginForm({
  error,
  message,
  onForgot,
}: {
  error?: string
  message?: string
  onForgot: () => void
}) {
  const errorMessage = error
    ? /invalid|credentials|password|email/i.test(error)
      ? 'Invalid email or password.'
      : error
    : null

  return (
    <>
      <h2 className="text-white font-semibold mb-1" style={{ fontSize: '28px' }}>
        Welcome back
      </h2>
      <p className="text-zinc-500 text-sm mb-8">Sign in to continue</p>

      <form action={login} className="space-y-5">
        {message && (
          <div className="rounded-md bg-emerald-950 border border-emerald-800 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-zinc-400 text-sm">Email</Label>
          <Input
            id="email" name="email" type="email"
            placeholder="you@example.com" required
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-zinc-400 text-sm">Password</Label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password" name="password" type="password"
            placeholder="••••••••" required
            className={inputCls}
          />
        </div>

        <LoginSubmitButton />

        {errorMessage && (
          <p className="text-sm text-red-400 text-center">{errorMessage}</p>
        )}
      </form>
    </>
  )
}

// ─── VIEW 2: Forgot password ──────────────────────────────────────────────────

function ForgotPasswordForm({ onBack, initialError }: { onBack: () => void; initialError?: string | null }) {
  const supabase  = createClient()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(initialError ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://blackhatswipe.com/login',
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <>
      <button
        type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mb-6"
      >
        ← Back to login
      </button>

      <h2 className="text-white font-semibold mb-1" style={{ fontSize: '28px' }}>
        Reset your password
      </h2>
      <p className="text-zinc-500 text-sm mb-8">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="rounded-lg bg-green-950 border border-green-800 px-4 py-4 flex items-start gap-3">
          <span className="text-green-400 font-bold shrink-0">✓</span>
          <p className="text-green-400 text-sm">Check your email for a reset link.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email" className="text-zinc-400 text-sm">Email address</Label>
            <Input
              id="forgot-email" type="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoFocus
              className={inputCls}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className={primaryBtn}
            style={{ backgroundColor: '#FACC15', color: '#000' }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Sending…</span>
              : 'Send Reset Link'
            }
          </button>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>
      )}
    </>
  )
}

// ─── VIEW 3: Reset password (recovery token in hash) ─────────────────────────

function ResetPasswordForm({
  accessToken,
  refreshToken,
}: {
  accessToken: string
  refreshToken: string
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState('')

  // Establish the recovery session so updateUser is authorised
  useEffect(() => {
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setError('This recovery link has expired or is invalid. Please request a new one.')
        } else {
          setSessionReady(true)
        }
      })
  }, [accessToken, refreshToken]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard/offers'), 2000)
  }

  return (
    <>
      <h2 className="text-white font-semibold mb-1" style={{ fontSize: '28px' }}>
        Set new password
      </h2>
      <p className="text-zinc-500 text-sm mb-8">Choose a strong password for your account.</p>

      {success ? (
        <div className="rounded-lg bg-green-950 border border-green-800 px-4 py-4 flex items-start gap-3">
          <span className="text-green-400 font-bold shrink-0">✓</span>
          <p className="text-green-400 text-sm">Password updated! Redirecting…</p>
        </div>
      ) : !sessionReady && !error ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Spinner /> Validating recovery link…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-zinc-400 text-sm">New password</Label>
            <Input
              id="new-password" type="password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={8}
              className={inputCls}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-zinc-400 text-sm">Confirm password</Label>
            <Input
              id="confirm-password" type="password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" required minLength={8}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className={primaryBtn}
            style={{ backgroundColor: '#FACC15', color: '#000' }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Updating…</span>
              : 'Update Password'
            }
          </button>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        </form>
      )}
    </>
  )
}

// ─── Root: detects recovery hash and picks the right view ────────────────────

type View = 'login' | 'forgot' | 'reset'

interface RecoveryTokens { accessToken: string; refreshToken: string }

interface LoginFormRootProps {
  error?: string
  message?: string
}

export default function LoginFormRoot({ error, message }: LoginFormRootProps) {
  const [view,           setView]           = useState<View>('login')
  const [recoveryTokens, setRecoveryTokens] = useState<RecoveryTokens | null>(null)
  const [hashError,      setHashError]      = useState<string | null>(null)

  // Check URL hash on mount — runs only client-side
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.substring(1))

    const errCode = params.get('error_code')
    const type    = params.get('type')
    const access  = params.get('access_token')
    const refresh = params.get('refresh_token') ?? ''

    // Clean the hash immediately so tokens/errors don't stay in the URL bar
    window.history.replaceState(null, '', window.location.pathname)

    if (errCode === 'otp_expired' || params.get('error') === 'access_denied') {
      // Token expired — show the forgot-password view with an explanatory message
      setHashError('This recovery link has expired. Enter your email to get a new one.')
      setView('forgot')
      return
    }

    if (type === 'recovery' && access) {
      setRecoveryTokens({ accessToken: access, refreshToken: refresh })
      setView('reset')
    }
  }, [])

  if (view === 'reset' && recoveryTokens) {
    return (
      <ResetPasswordForm
        accessToken={recoveryTokens.accessToken}
        refreshToken={recoveryTokens.refreshToken}
      />
    )
  }

  if (view === 'forgot') {
    return <ForgotPasswordForm onBack={() => setView('login')} initialError={hashError} />
  }

  return (
    <LoginForm
      error={error}
      message={message}
      onForgot={() => setView('forgot')}
    />
  )
}
