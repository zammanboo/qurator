import { NextResponse } from 'next/server'

export function middleware(request) {
  // Check multiple headers for the original host (Firebase App Hosting uses x-forwarded-host)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const originalHost = forwardedHost || host

  // Redirect zubu9dan.com to www.zubu9dan.com (permanent redirect)
  if (originalHost === 'zubu9dan.com' || originalHost?.startsWith('zubu9dan.com:')) {
    // Construct URL directly to avoid internal port issues
    const redirectUrl = `https://www.zubu9dan.com${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(redirectUrl, 301)
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
