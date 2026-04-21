'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveToSwipeFile(data: {
  offer_id?: string
  title: string
  url?: string
  niche?: string
  type?: string
  notes?: string
  tags?: string[]
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('swipe_items').insert({
    user_id: user.id,
    title: data.title,
    url: data.url ?? null,
    niche: data.niche ?? null,
    type: data.type ?? null,
    notes: data.notes ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/swipe-file')
  return {}
}

export async function addSwipeItem(data: {
  title: string
  url?: string
  niche?: string
  type?: string
  notes?: string
  tags?: string[]
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('swipe_items').insert({
    user_id: user.id,
    title: data.title,
    url: data.url ?? null,
    niche: data.niche ?? null,
    type: data.type ?? null,
    notes: data.notes ?? null,
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
