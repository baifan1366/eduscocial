import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 创建国际化中间件
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'zh', 'my'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
];

// List of admin-only routes
const adminRoutes = [
  '/admin',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(`/en${route}`) || 
    pathname.startsWith(`/zh${route}`) || 
    pathname.startsWith(`/my${route}`)
  );

  // Check if this is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(`/en${route}`) || 
    pathname.startsWith(`/zh${route}`) || 
    pathname.startsWith(`/my${route}`)
  );

  // If this is a protected or admin route, check for authentication
  if (isProtectedRoute || isAdminRoute) {
    const token = await getToken({ req: request });
    
    // If no token, redirect to login page with callbackUrl
    if (!token) {
      const loginUrl = new URL(`/${request.nextUrl.locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // For admin routes, check if user has admin role
    if (isAdminRoute && token.role !== 'ADMIN') {
      // Redirect to unauthorized page if not an admin
      return NextResponse.redirect(
        new URL(`/${request.nextUrl.locale}/unauthorized`, request.url)
      );
    }
  }

  // For all other routes, apply internationalization middleware
  return intlMiddleware(request);
}

// 更新 matcher 配置以包含更多特定路径
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png|.*\\.webp|.*\\.svg|.*\\.glb|favicon.ico).*)',
    '/:locale(en|zh|my)/:path*'
  ]
};
