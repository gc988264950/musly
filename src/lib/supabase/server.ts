/**
 * Supabase server client (RSC / Server Actions / Route Handlers)
 *
 * To activate:
 *  1. npm install @supabase/supabase-js @supabase/ssr
 *  2. Copy .env.local.example → .env.local and fill in your project credentials
 *  3. Uncomment the code below and remove the placeholder export
 */

// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// import type { Database } from '@/types/supabase'

// export function createClient() {
//   const cookieStore = cookies()
//   return createServerClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() { return cookieStore.getAll() },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) =>
//               cookieStore.set(name, value, options)
//             )
//           } catch {}
//         },
//       },
//     }
//   )
// }

/** Placeholder — remove when Supabase is configured. */
export function createClient(): never {
  throw new Error(
    'Supabase is not yet configured. ' +
    'Follow the instructions in src/lib/supabase/server.ts to set it up.'
  )
}
