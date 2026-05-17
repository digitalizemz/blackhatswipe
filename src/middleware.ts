import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPER_ADMIN_ID = '48c6c46d-9d2b-451b-94d9-b95ee7689823'

export async function middleware(request: NextRequest) {
  const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const { pathname } = request.nextUrl

  // Skip API routes completely
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
      const profileClient = createServerClient(supabaseUrl, supabaseServiceKey, { cookies: { getAll: () => [], setAll: () => {} } })
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
