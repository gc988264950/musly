import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route protection middleware.
 *
 * Uses the `harmoniq-session` and `harmoniq-role` cookies set by mock-auth.ts.
 * When Supabase is integrated, replace cookie checks with @supabase/ssr session check.
 *
 * Role routing:
 *  - 'professor' → teacher paths (/dashboard, /students, …)
 *  - 'aluno'     → student portal (/student/*)
 */

const SESSION_COOKIE = 'harmoniq-session'
const ROLE_COOKIE = 'harmoniq-role'

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
]

/** Student portal paths */
const STUDENT_PATHS = ['/student']

const AUTH_PATHS = ['/login', '/signup', '/student-login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? 'professor'

  const isTeacherPath = TEACHER_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isStudentPath = STUDENT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isProtected = isTeacherPath || isStudentPath
  const isAuthPage = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // Redirect unauthenticated users to login
  if (isProtected && !sessionToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (sessionToken) {
    // Redirect students away from teacher paths
    if (isTeacherPath && role === 'aluno') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }

    // Redirect teachers away from student portal
    if (isStudentPath && role === 'professor') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect logged-in users away from auth pages
    if (isAuthPage) {
      const dest = role === 'aluno' ? '/student/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
