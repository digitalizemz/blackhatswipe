'use client'

import { useFormStatus } from 'react-dom'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Must be a child of <form> to read its pending state via useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-bold rounded-lg transition-all hover:brightness-110 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
      style={{ backgroundColor: '#FACC15', color: '#000000', height: '44px' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Signing in...
        </span>
      ) : (
        'Sign In'
      )}
    </button>
  )
}

interface LoginFormProps {
  error?: string
  message?: string
}

export default function LoginForm({ error, message }: LoginFormProps) {
  // Normalise Supabase error messages to user-friendly text
  const errorMessage = error
    ? /invalid|credentials|password|email/i.test(error)
      ? 'Invalid email or password.'
      : error
    : null

  return (
    <form action={login} className="space-y-5">
      {message && (
        <div className="rounded-md bg-emerald-950 border border-emerald-800 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      )}

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
          required
          className="h-11 bg-[#111111] border-[#27272A] text-white placeholder:text-zinc-600
                     focus-visible:border-[#FACC15] focus-visible:ring-2
                     focus-visible:ring-[#FACC15]/20 focus-visible:ring-offset-0"
        />
      </div>

      <SubmitButton />

      {/* Inline error — shown below the button after a failed attempt */}
      {errorMessage && (
        <p className="text-sm text-red-400 text-center">{errorMessage}</p>
      )}
    </form>
  )
}
