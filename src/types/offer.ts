export interface SupabaseOffer {
  id: string
  title: string
  description: string | null
  status: string
  is_winning: boolean
  is_scaling: boolean
  scaling_status: string | null
  thumbnail_url: string | null
  vsl_url: string | null
  today_ads: number | null
  yesterday_ads: number | null
  days_running: number | null
  total_views: number | null
  estimated_daily_spend: number | null
  niche_id: string | null
  offer_type_id: string | null
  language_id: string | null
  traffic_source_id: string | null
  fb_library_url: string | null
  tags: string[] | null
  links: { name: string; url: string }[] | null
  added_by: string | null
  created_at: string
  // joined relations
  niches: { name: string; color: string | null } | null
  languages: { name: string; code: string | null; flag_emoji: string | null } | null
  traffic_sources: { name: string } | null
  offer_types: { name: string } | null
  offer_files: Array<{ id: string; folder_name: string; cpm_estimated: number | null; initial_views: number | null }> | null
}

export interface OfferSnapshot {
  id: string
  offer_id: string
  ad_count: number
  snapshot_date: string
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
  // scraping fields (columns already exist in DB)
  post_url: string | null
  views: number | null
  likes: number | null
  comments: number | null
  screenshot_url: string | null
  scrape_status: 'no_url' | 'active' | 'inactive' | 'paused' | null
  last_scraped_at: string | null
  cpm_estimated: number | null
  target_market: string | null
  initial_views: number | null
  initial_likes: number | null
  initial_comments: number | null

  creative_status: string | null
}
