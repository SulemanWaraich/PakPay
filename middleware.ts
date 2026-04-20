import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED = new Set([
  'https://pakpay-mobile.preview.emergentagent.com',
  'http://localhost:3000',
  'http://localhost:19006',
]);

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const isAllowed =
    ALLOWED.has(origin) || /^https:\/\/[a-z0-9-]+\.preview\.emergentagent\.com$/.test(origin);

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Cookie');
      res.headers.set('Vary', 'Origin');
    }
    return res;
  }

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
  }
  return res;
}

export const config = { matcher: '/api/:path*' };