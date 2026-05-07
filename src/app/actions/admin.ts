'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createClient } from '@/lib/supabase/server'

export type OfferStatus = 'Active' | 'Paused' | 'Scaling'
export type UserPlan    = 'free' | 'pro' | 'elite' | 'admin'
export type UserRole    = 'user' | 'editor' | 'admin'

export interface AdminOffer {
  id?: string
  title: string
  description?: string
  status: OfferStatus
  is_winning?: boolean
  is_scaling?: boolean
  thumbnail_url?: string
  niche_id?: string
  sub_niche_id?: string
  offer_type_id?: string
  language_id?: string
  traffic_source_id?: string
  today_ads?: number
  yesterday_ads?: number
  days_running?: number
  landing_page_url?: string
  back_redirect_url?: string
  order_bump_url?: string
  upsells?: { name: string; url: string }[]
  downsells?: { name: string; url: string }[]
  facebook_ad_library_url?: string
  tiktok_library_url?: string
  youtube_library_url?: string
  save_snapshot?: boolean
  tags?: string[]
  vsl_urls?: string[]
  links?: { name: string; url: string }[]
}

export interface AdminCreative {
  id?: string
  offer_id: string
  type: 'video' | 'image'
  media_url?: string
  native_url?: string
  thumbnail_url?: string
  angle?: string
  traffic_source_id?: string
  language_id?: string
  views_today?: number
  views_yesterday?: number
  is_scaled?: boolean
  save_snapshot?: boolean
}

export interface LookupItem {
  id: string
  name: string
  slug?: string
  color?: string
  code?: string
  flag_emoji?: string
  active: boolean
  created_at?: string
  niche_id?: string
}

export async function upsertOffer(data: AdminOffer): Promise<{ id?: string; error?: string }> {
  const supabase = createAdminClient()

  const { save_snapshot, ...offerData } = data

  try {
    let offerId: string

    if (data.id) {
      const { data: result, error } = await supabase
        .from('offers')
        .update(offerData)
        .eq('id', data.id)
        .select('id')
        .single()

      if (error) return { error: error.message }
      offerId = result.id
    } else {
      const { data: result, error } = await supabase
        .from('offers')
        .insert(offerData)
        .select('id')
        .single()

      if (error) return { error: error.message }
      offerId = result.id
    }

    if (save_snapshot && offerId) {
      await supabase.from('offer_ad_snapshots').insert({
        offer_id: offerId,
        ads_count: data.today_ads ?? 0,
        snapshotted_at: new Date().toISOString(),
      })
    }

    revalidatePath('/admin/offers')
    return { id: offerId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: message }
  }
}

export async function deleteOffer(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('offers').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/offers')
  return {}
}

export async function upsertCreative(data: AdminCreative): Promise<{ id?: string; error?: string }> {
  const supabase = createAdminClient()

  const { save_snapshot, ...creativeData } = data

  try {
    let creativeId: string

    if (data.id) {
      const { data: result, error } = await supabase
        .from('creatives')
        .update(creativeData)
        .eq('id', data.id)
        .select('id')
        .single()

      if (error) return { error: error.message }
      creativeId = result.id
    } else {
      const { data: result, error } = await supabase
        .from('creatives')
        .insert(creativeData)
        .select('id')
        .single()

      if (error) return { error: error.message }
      creativeId = result.id
    }

    if (save_snapshot && creativeId) {
      await supabase.from('creative_views_snapshots').insert({
        creative_id: creativeId,
        views_count: data.views_today ?? 0,
      })
    }

    revalidatePath('/admin/creatives')
    return { id: creativeId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: message }
  }
}

export async function deleteCreative(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from('creatives').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/creatives')
  return {}
}

export async function updateUserPlan(userId: string, plan: UserPlan): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Capture who is making the change for the audit trail
  const serverClient = await createClient()
  const { data: { user: currentUser } } = await serverClient.auth.getUser()

  // Try with audit fields; fall back gracefully if the columns don't exist yet
  const { error } = await supabase.from('profiles').update({
    plan,
    plan_changed_at: new Date().toISOString(),
    ...(currentUser?.id ? { plan_changed_by: currentUser.id } : {}),
  }).eq('id', userId)

  if (error) {
    // Columns may not exist — retry with just the plan
    const { error: err2 } = await supabase.from('profiles').update({ plan }).eq('id', userId)
    if (err2) return { error: err2.message }
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/plans')
  return {}
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}

export async function updateUserProfile(
  userId: string,
  data: { full_name?: string | null; phone?: string | null; plan?: UserPlan; role?: UserRole }
): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').update(data).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return {}
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  // Remove the profile first (avoids FK constraint issues on some DB setups)
  await supabase.from('profiles').delete().eq('id', userId)

  // Remove from auth — this is the authoritative delete
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return {}
}

export async function inviteUser(data: {
  email: string
  full_name?: string
  phone?: string
  role?: UserRole
  plan?: UserPlan
}): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.blackhatswipe.com'
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(data.email, {
    redirectTo: `${siteUrl}/set-password`,
  })
  if (error) return { error: error.message }
  if (invited?.user?.id) {
    await supabase.from('profiles').upsert({
      id:        invited.user.id,
      email:     data.email,
      full_name: data.full_name ?? null,
      phone:     data.phone    ?? null,
      role:      data.role     ?? 'user',
      plan:      data.plan     ?? 'free',
    })
  }
  revalidatePath('/admin/users')
  return {}
}

export async function createLookupItem(table: string, data: Partial<LookupItem>): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from(table).insert(data)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}

export async function updateLookupItem(table: string, id: string, data: Partial<LookupItem>): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from(table).update(data).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}

export async function deleteLookupItem(table: string, id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from(table).delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}

export async function toggleLookupActive(table: string, id: string, active: boolean): Promise<{ error?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase.from(table).update({ active }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}
