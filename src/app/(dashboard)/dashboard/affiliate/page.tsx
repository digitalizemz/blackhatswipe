'use client'

import { useUserProfile, userIsPro } from '@/lib/user-profile-context'

export default function AffiliatePage() {
  const profile = useUserProfile()
  const isPro   = userIsPro(profile)

  if (!isPro) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Affiliate Program</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginBottom: 32 }}>
          Earn recurring commissions by referring new members to BlackHat Swipe Pro.
        </p>

        <div style={{
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 12,
          padding: '40px 32px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>🔒</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Pro Members Only</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
            The affiliate program is exclusively available to BlackHat Swipe Pro members. Upgrade to Pro to unlock your affiliate link and start earning commissions.
          </p>
          <a
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: '#EAB308',
              color: '#000',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none'
            }}
          >
            Upgrade to Pro →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

      {/* Header */}
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Affiliate Program</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, marginBottom: 24 }}>
        Earn recurring commissions by referring new members to BlackHat Swipe Pro.
      </p>

      {/* Instant approval banner */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.08)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          <strong>Instant approval.</strong> Join the affiliate program, get your link immediately, and start earning — 50% on the first sale + 30% every month the customer stays subscribed.
        </p>
      </div>

      {/* Commission cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#EAB308' }}>50%</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>First sale commission</p>
          <p style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>$14.98 per member</p>
        </div>
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#EAB308' }}>30%</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Recurring commission</p>
          <p style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Every month they stay</p>
        </div>
        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#EAB308' }}>∞</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Cookie duration</p>
          <p style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Last click attribution</p>
        </div>
      </div>

      {/* Why promote */}
      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: 10, padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Why promote BlackHat Swipe?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            'High-converting offer targeting affiliate marketers, media buyers, and info product creators',
            '$29.97/month price point — easy sell with massive perceived value',
            'Recurring income — one sale pays you every month automatically',
            'Strong retention — members stay because the platform delivers real results',
            'Dedicated affiliate support via WhatsApp and Telegram',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#EAB308', marginTop: 1 }}>→</span>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best traffic sources */}
      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)', borderRadius: 10, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Best traffic sources</h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          YouTube reviews, Instagram Reels, TikTok, email lists, WhatsApp groups, Telegram channels.<br/>
          <strong style={{ color: 'var(--color-text-primary)' }}>Target audiences:</strong> affiliate marketing, Facebook Ads, media buying, dropshipping, digital marketing, make money online.
        </p>
      </div>

      {/* CTA */}
      <a
        href="https://app-vlc.hotmart.com/affiliate-recruiting/view/1302B105946792"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          padding: '16px',
          background: '#EAB308',
          color: '#000',
          borderRadius: 8,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 16,
          textDecoration: 'none',
          letterSpacing: 0.3
        }}
      >
        Become an Affiliate on Hotmart →
      </a>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 12 }}>
        Managed by Hotmart. Instant approval — get your affiliate link and start promoting right now.
      </p>

    </div>
  )
}
