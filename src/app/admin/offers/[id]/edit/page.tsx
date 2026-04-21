import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin-client'
import OfferWizard from '@/components/admin/offer-wizard'
import type { AdminOffer } from '@/app/actions/admin'

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: offer, error } = await supabase
    .from('offers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !offer) {
    redirect('/admin/offers')
  }

  const offerData: AdminOffer & { tags?: string[]; vsl_urls?: string[] } = {
    id: offer.id as string,
    title: (offer.title ?? '') as string,
    description: (offer.description ?? '') as string,
    status: (offer.status ?? 'Active') as AdminOffer['status'],
    is_winning: (offer.is_winning ?? false) as boolean,
    thumbnail_url: (offer.thumbnail_url ?? '') as string,
    niche_id: (offer.niche_id ?? '') as string,
    sub_niche_id: (offer.sub_niche_id ?? '') as string,
    offer_type_id: (offer.offer_type_id ?? '') as string,
    language_id: (offer.language_id ?? '') as string,
    traffic_source_id: (offer.traffic_source_id ?? '') as string,
    today_ads: (offer.today_ads ?? 0) as number,
    yesterday_ads: (offer.yesterday_ads ?? 0) as number,
    days_running: (offer.days_running ?? 0) as number,
    landing_page_url: (offer.landing_page_url ?? '') as string,
    back_redirect_url: (offer.back_redirect_url ?? '') as string,
    order_bump_url: (offer.order_bump_url ?? '') as string,
    facebook_ad_library_url: (offer.facebook_ad_library_url ?? '') as string,
    tiktok_library_url: (offer.tiktok_library_url ?? '') as string,
    youtube_library_url: (offer.youtube_library_url ?? '') as string,
    save_snapshot: false,
    tags: Array.isArray(offer.tags) ? (offer.tags as string[]) : [],
    vsl_urls: Array.isArray(offer.vsl_urls) ? (offer.vsl_urls as string[]) : [],
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Offer</h1>
      <OfferWizard initialData={offerData} />
    </div>
  )
}
