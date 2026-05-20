'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveToSwipeFile(data: {
  offer_id?: string
  title: string
  url?: string
  thumbnail_url?: string
  niche?: string
  type?: string
  notes?: string
  tags?: string[]
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (data.offer_id) {
    const { data: existing } = await supabase
      .from('swipe_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', data.offer_id)
      .single()
    if (existing) return { error: 'Offer already saved to swipe file' }
  }

  const { error } = await supabase.from('swipe_items').insert({
    user_id:       user.id,
    offer_id:      data.offer_id      ?? null,
    title:         data.title,
    url:           data.url           ?? null,
    thumbnail_url: data.thumbnail_url ?? null,
    niche:         data.niche         ?? null,
    type:          data.type          ?? null,
    notes:         data.notes         ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/swipe-file')
  return {}
}


export async function deleteSwipeItem(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('swipe_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/swipe-file')
  return {}
}
