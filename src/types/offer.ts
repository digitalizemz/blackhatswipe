export interface SupabaseOffer {
  id: string
  title: string
  description: string | null
  status: string
  is_winning: boolean
  thumbnail_url: string | null
  today_ads: number | null
  yesterday_ads: number | null
  days_running: number | null
  niche_id: string | null
  offer_type_id: string | null
  language_id: string | null
  traffic_source_id: string | null
  landing_page_url: string | null
  back_redirect_url: string | null
  order_bump_url: string | null
  upsells: { name: string; url: string }[] | null
  downsells: { name: string; url: string }[] | null
  facebook_ad_library_url: string | null
  tiktok_library_url: string | null
  youtube_library_url: string | null
  tags: string[] | null
  created_at: string
  // joined relations
  niches: { name: string; color: string | null } | null
  languages: { name: string; code: string | null; flag_emoji: string | null } | null
  traffic_sources: { name: string } | null
  offer_types: { name: string } | null
}

export interface OfferSnapshot {
  id: string
  offer_id: string
  ads_count: number
  snapshotted_at: string
}

export interface OfferFile {
  id: string
  offer_id: string
  folder_name: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}
