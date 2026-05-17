import { createAdminClient } from '@/lib/supabase/admin-client'
import { requireAdmin } from '@/lib/supabase/require-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Remove undefined keys
    Object.keys(updates).forEach(k => {
      if (updates[k] === undefined) delete updates[k]
    })

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('offer_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('offer_files update error:', error.message, error.code, error.details)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ creative: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('PATCH update-creative crash:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
