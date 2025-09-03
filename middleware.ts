import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'


export async function middleware(request: NextRequest) {
return await updateSession(request)
}


export const config = {
matcher: [
// Aplica o middleware em tudo, exceto estáticos/imagens/favicon **e** /a/home (público)
'/((?!a/home|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
