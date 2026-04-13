/**
 * GET /auth/callback
 *
 * Handles:
 *  - Email confirmation links (signup verification)
 *  - Google OAuth redirect
 *
 * After code exchange, sets role metadata for new Google users and
 * redirects to the appropriate dashboard based on user role.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  if (error) {
    console.error('[Auth callback] OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth callback] Code exchange error:', exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=callback_failed`)
  }

  // Get the user after session exchange
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // New Google/OAuth users won't have a role yet — default to 'professor'
    if (!user.user_metadata?.role) {
      await supabase.auth.updateUser({
        data: {
          role: 'professor',
          firstName: user.user_metadata?.full_name?.split(' ')[0] ?? '',
          lastName:  user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ?? '',
        },
      })
    }

    // Route based on role
    const role = user.user_metadata?.role ?? 'professor'
    const dest = role === 'aluno' ? '/student/dashboard' : next
    return NextResponse.redirect(`${origin}${dest}`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
