/**
 * Supabase browser client
 *
 * To activate:
 *  1. npm install @supabase/supabase-js @supabase/ssr
 *  2. Copy .env.local.example → .env.local and fill in your project credentials
 *  3. Uncomment the code below and remove the placeholder export
 */

// import { createBrowserClient } from '@supabase/ssr'
// import type { Database } from '@/types/supabase'

// export function createClient() {
//   return createBrowserClient<Database>(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )
// }

/** Placeholder — remove when Supabase is configured. */
export function createClient(): never {
  throw new Error(
    'Supabase is not yet configured. ' +
    'Follow the instructions in src/lib/supabase/client.ts to set it up.'
  )
}
