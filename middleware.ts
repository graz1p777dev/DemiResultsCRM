import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Читаем сессию из cookie — без DB-запроса
  const { data: { session } } = await supabase.auth.getSession()

  const pathname      = request.nextUrl.pathname
  const isDashboard   = pathname.startsWith('/dashboard')
  const isAuthPage    = pathname.startsWith('/auth')

  // Без сессии — только публичные auth-страницы
  if (isDashboard && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // /auth/reset-password и /auth/change-password требуют активную сессию — не редиректим
  const isSessionRequired = pathname === '/auth/reset-password' || pathname === '/auth/change-password'
  if (isAuthPage && !isSessionRequired && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}
