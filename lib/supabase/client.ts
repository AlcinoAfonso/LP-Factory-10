1import { createBrowserClient } from '@supabase/ssr'
2
3export function createClient() {
4  return createBrowserClient(
5    process.env.NEXT_PUBLIC_SUPABASE_URL!,
6    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
7  )
8}
