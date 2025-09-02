1import { createServerClient } from '@supabase/ssr'
2import { cookies } from 'next/headers'
3
4/**
5 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
6 * function when using it.
7 */
8export async function createClient() {
9  const cookieStore = await cookies()
10
11  return createServerClient(
12    process.env.NEXT_PUBLIC_SUPABASE_URL!,
13    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
14    {
15      cookies: {
16        getAll() {
17          return cookieStore.getAll()
18        },
19        setAll(cookiesToSet) {
20          try {
21            cookiesToSet.forEach(({ name, value, options }) =>
22              cookieStore.set(name, value, options)
23            )
24          } catch {
25            // The `setAll` method was called from a Server Component.
26            // This can be ignored if you have middleware refreshing
27            // user sessions.
28          }
29        },
30      },
31    }
32  )
33}
