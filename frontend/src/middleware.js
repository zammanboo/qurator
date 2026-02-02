import { NextResponse } from 'next/server'

export function middleware(request) {
  // Check multiple headers for the original host (Firebase App Hosting uses x-forwarded-host)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const originalHost = forwardedHost || host

  // Redirect zubu9dan.com to www.zubu9dan.com (permanent redirect)
  if (originalHost === 'zubu9dan.com' || originalHost?.startsWith('zubu9dan.com:')) {
    const url = new URL(request.url)
    url.hostname = 'www.zubu9dan.com'
    url.port = '' // Remove internal port (Firebase uses 8080 internally)
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
