import { NextRequest, NextResponse } from 'next/server';

// Version mappings for redirects
const VERSION_REDIRECTS: Record<string, string> = {
  'contracts': 'contracts/v5.x',
  'contracts-upgradeable': 'contracts-upgradeable/v5.x', 
  'cairo-contracts': 'cairo-contracts/v2.x',
  'community-contracts': 'community-contracts/v1.x',
  'compact-contracts': 'compact-contracts/v0.x',
  'confidential-contracts': 'confidential-contracts/v0.x',
  'contracts-stylus': 'contracts-stylus/v0.x',
  'stellar-contracts': 'stellar-contracts/v0.x',
  'substrate-runtimes': 'substrate-runtimes/v3.x',
  'nile': 'nile/v0.x',
  'uniswap-hooks': 'uniswap-hooks/v1.x',
  'tools/openzeppelin-monitor': 'tools/openzeppelin-monitor/v1.x',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this path needs a version redirect
  for (const [path, redirect] of Object.entries(VERSION_REDIRECTS)) {
    if (pathname === `/${path}` || pathname === `/${path}/`) {
      const url = request.nextUrl.clone();
      url.pathname = `/${redirect}`;
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};