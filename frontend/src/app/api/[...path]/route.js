import { NextResponse } from 'next/server';

const PROXY_URL = process.env.API_PROXY_URL || 'http://localhost:8000';

async function proxy(request) {
    const pathname = request.nextUrl.pathname;

    // /api/... pattern starts after the domain.
    // We want to forward the exact path and query string to the backend.
    const targetUrl = new URL(pathname, PROXY_URL);
    targetUrl.search = request.nextUrl.search;

    console.log(`[Proxy] Forwarding ${request.method} ${pathname} to ${targetUrl.toString()}`);

    try {
        const body = (request.method !== 'GET' && request.method !== 'HEAD')
            ? await request.blob()
            : null;

        const headers = new Headers(request.headers);
        headers.set('host', new URL(PROXY_URL).host); // Clean host header

        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: body,
            // standard, cors, etc. handled by backend usually, but nextjs fetch defaults might need tweaking
            cache: 'no-store'
        });

        // Copy content from backend response
        const data = await response.blob();
        const responseHeaders = new Headers(response.headers);

        return new NextResponse(data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('[Proxy] Error:', error);
        return NextResponse.json({ error: 'Proxy Request Failed', details: error.message }, { status: 502 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const OPTIONS = proxy;
