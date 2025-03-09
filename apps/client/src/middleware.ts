import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow access to auth pages
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        return NextResponse.next()
    }

    // Check for auth token
    const token = request.cookies.get('auth-token')
    if (!token && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
} 