'use server'

import { createClient } from '@/lib/supabase/server'

export async function addOfferFile(data: {
  offer_id: string
  folder_name: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('offer_files').insert({
    offer_id: data.offer_id,
    folder_name: data.folder_name,
    file_name: data.file_name,
    file_url: data.file_url,
    file_type: data.file_type ?? null,
    file_size: data.file_size ?? null,
    uploaded_by: user.id,
  })

  if (error) return { error: error.message }
  return {}
}

export async function deleteOfferFile(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('offer_files').delete().eq('id', id)

  if (error) return { error: error.message }
  return {}
}
