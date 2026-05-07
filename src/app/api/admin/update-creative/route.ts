import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'


const supabaseAdmin = createClient(
  'https://lladxcxjmxtrsorvagql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(req: NextRequest) {
  try {
    console.log('PATCH update-creative called')
    const body = await req.json()
    const { id, ...updates } = body
    console.log('id:', id, 'updates:', updates)

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Remove undefined keys
    Object.keys(updates).forEach(k => {
      if (updates[k] === undefined) delete updates[k]
    })

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
