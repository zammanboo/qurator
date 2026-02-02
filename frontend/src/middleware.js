import { NextResponse } from 'next/server'

export function middleware(request) {
  const host = request.headers.get('host')

  // Redirect zubu9dan.com to www.zubu9dan.com (permanent redirect)
  if (host === 'zubu9dan.com' || host?.startsWith('zubu9dan.com:')) {
    const url = new URL(request.url)
    url.hostname = 'www.zubu9dan.com'
    return NextResponse.redirect(url.toString(), 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
