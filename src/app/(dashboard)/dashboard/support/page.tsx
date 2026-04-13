'use client'

import { useState } from 'react'
import { BookOpen, MessageCircle, Mail, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const supportCards = [
  {
    title: 'Documentation',
    description: 'Browse guides, tutorials, and how-to articles.',
    icon: BookOpen,
    cta: 'Open Docs →',
    href: '#',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    title: 'WhatsApp',
    description: 'Chat directly with our team for fast support.',
    icon: MessageCircle,
    cta: 'Open Chat →',
    href: '#',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    title: 'Email',
    description: 'Send us a message — we reply within 24 hours.',
    icon: Mail,
    cta: 'Send Email →',
    href: 'mailto:support@blackhatswipe.com',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
]

const faqs = [
  {
    q: 'What is Black Hat Swipe?',
    a: 'Black Hat Swipe is a competitive intelligence platform for direct response marketers. We track thousands of offers across Facebook, YouTube, TikTok, and Native Ads so you can spy on what\'s scaling and model winning copy.',
  },
  {
    q: 'How often is the offer library updated?',
    a: 'Our database is updated every 24 hours. The "Scaling Now" section shows offers that are actively running ads within the last 48 hours.',
  },
  {
    q: 'Can I save offers to my swipe file?',
    a: 'Yes! Click the star ⭐ icon on any offer card to add it to your Favorites. Use My Swipe File to save your own notes, ad screenshots, and creative references.',
  },
  {
    q: 'What platforms do you track?',
    a: 'We currently track Facebook, Instagram, YouTube, TikTok, and Native Ads networks. Additional platforms are being added regularly.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can cancel anytime from the Settings page. Your access will continue until the end of your current billing period.',
  },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
          Support
        </h1>
        <p className="text-zinc-400 text-sm">We&apos;re here to help. Reach us any way you prefer.</p>
      </div>

      {/* Support cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {supportCards.map((card) => {
          const Icon = card.icon
          return (
            <a
              key={card.title}
              href={card.href}
              className="bg-[#111111] border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all duration-200 cursor-pointer block"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-4 border', card.bg, card.border)}>
                <Icon className={cn('w-5 h-5', card.color)} />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-zinc-500 text-xs mb-4 leading-relaxed">{card.description}</p>
              <span className={cn('text-xs font-medium', card.color)}>{card.cta}</span>
            </a>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="mb-4">
        <h2 className="text-white font-semibold text-base mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-[#111111] border border-zinc-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm text-white hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <span className="font-medium">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-4',
                    openFaq === i && 'rotate-180'
                  )}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-zinc-400 border-t border-zinc-800 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
