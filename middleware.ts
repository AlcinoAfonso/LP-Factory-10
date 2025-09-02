1import { updateSession } from '@/lib/supabase/middleware'
2import { type NextRequest } from 'next/server'
3
4export async function middleware(request: NextRequest) {
5  return await updateSession(request)
6}
7
8export const config = {
9  matcher: [
10    /*
11     * Match all request paths except:
12     * - _next/static (static files)
13     * - _next/image (image optimization files)
14     * - favicon.ico (favicon file)
15     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
16     * Feel free to modify this pattern to include more paths.
17     */
18    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
19  ],
20}
