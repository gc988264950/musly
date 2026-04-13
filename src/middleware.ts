import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/** Teacher-only paths */
const TEACHER_PATHS = [
  '/dashboard',
  '/students',
  '/lessons',
  '/calendar',
  '/progress',
  '/billing',
  '/settings',
  '/lesson-mode',
  '/agenda',
  '/notifications',
  '/plans',
  '/ai-assistant',
]

/** Student portal paths */
const STUDENT_PATHS = ['/student']

const AUTH_PATHS = ['/login', '/signup', '/student-login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass-through for non-app paths
  const isTeacherPath = TEACHER_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isStudentPath = STUDENT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isProtected = isTeacherPath || isStudentPath
  const isAuthPage  = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // Create a response that we'll pass through cookies on
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          // Write cookies to both request and response so the session is refreshed
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() refreshes the session token if needed
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.user_metadata?.role ?? 'professor') as 'professor' | 'aluno'

  // ── Unauthenticated → redirect to login ─────────────────────────────────────
  if (isProtected && !user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    // Students trying to access teacher paths → student dashboard
    if (isTeacherPath && role === 'aluno') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // Teachers trying to access student portal → teacher dashboard
    if (isStudentPath && role === 'professor') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Logged-in users visiting auth pages → their dashboard
    if (isAuthPage) {
      const dest = role === 'aluno' ? '/student/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
