'use client'

import { createContext, useContext, useState } from 'react'
import UpgradeModal from '@/components/ui/upgrade-modal'

export interface UserProfile {
  plan: string
  role: string
}

// ─── Profile context ──────────────────────────────────────────────────────────

const Ctx = createContext<UserProfile>({ plan: 'free', role: 'user' })

// ─── Upgrade modal context ────────────────────────────────────────────────────

const UpgradeCtx = createContext<{ show: () => void }>({ show: () => {} })

export function useUpgradeModal() {
  return useContext(UpgradeCtx)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function userIsAdmin(p: UserProfile): boolean {
  return p.role === 'admin' || p.plan === 'admin' // legacy plan='admin'
}

export function userIsEditor(p: UserProfile): boolean {
  return p.role === 'editor'
}

export function userIsPro(p: UserProfile): boolean {
  return p.plan === 'pro' || userIsAdmin(p) || userIsEditor(p)
}

export function userIsFree(p: UserProfile): boolean {
  return !userIsPro(p)
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUserProfile(): UserProfile {
  return useContext(Ctx)
}

export function useUserPlan() {
  const p = useContext(Ctx)
  return {
    plan:     p.plan,
    role:     p.role,
    isPro:    userIsPro(p),
    isFree:   userIsFree(p),
    isAdmin:  userIsAdmin(p),
    isEditor: userIsEditor(p),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProfileProvider({
  children,
  plan,
  role,
}: {
  children: React.ReactNode
  plan: string
  role: string
}) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  return (
    <Ctx.Provider value={{ plan, role }}>
      <UpgradeCtx.Provider value={{ show: () => setUpgradeOpen(true) }}>
        {children}
        {upgradeOpen && <UpgradeModal onClose={() => setUpgradeOpen(false)} />}
      </UpgradeCtx.Provider>
    </Ctx.Provider>
  )
}
