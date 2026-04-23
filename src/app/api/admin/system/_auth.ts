/**
 * Shared admin auth helper.
 * Returns the Supabase service-role client after verifying the caller is the
 * configured admin email. Throws a Response on failure so callers can return it.
 */
import { createClient as createSSR }       from '@/lib/supabase/server'
import { createClient as createServiceRole } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export function adminDb() {
  return createServiceRole(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function requireAdmin(): Promise<
  { ok: true; db: ReturnType<typeof adminDb> } |
  { ok: false; res: NextResponse }
> {
  const supabase = await createSSR()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!user || !adminEmail || user.email !== adminEmail) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }),
    }
  }
  return { ok: true, db: adminDb() }
}
