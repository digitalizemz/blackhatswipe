import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = 'https://lladxcxjmxtrsorvagql.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzM4MDAsImV4cCI6MjA5MTU0OTgwMH0.8psiXvSaMKp6NyvbpoZB1gKKEH7Mg9DSrWgMCnnC8nA'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3MzgwMCwiZXhwIjoyMDkxNTQ5ODAwfQ.I8lHnRarW-QL0iDv87ExYffLOZIhZ5Z1wmhJDtKIvIo'
const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes completely
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // Public routes
  if (pathname === '/set-password' || pathname === '/reset-password') {
    return supabaseResponse
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    if (user.id === SUPER_ADMIN_ID) return supabaseResponse

    let profile: { plan: string; role: string } | null = null
    try {
      const profileClient = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { cookies: { getAll: () => [], setAll: () => {} } })
      const { data } = await profileClient.from('profiles').select('plan, role').eq('id', user.id).single()
      profile = data
    } catch { /* fall through */ }

    const isAdminOrEditor = profile?.role === 'admin' || profile?.role === 'editor' || profile?.plan === 'admin'
    if (!isAdminOrEditor) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/offers'
      return NextResponse.redirect(url)
    }

    if (profile?.role === 'editor' && pathname === '/admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/offers'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  const isProtected = pathname.startsWith('/dashboard')
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',],
}
