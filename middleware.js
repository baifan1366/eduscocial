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

// List of admin-only routes that require admin authentication
const adminRoutes = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/settings',
];

// List of public routes that should be excluded from protection
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/admin/login',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const locale = request.nextUrl.locale || 'en';
  
  // Check if this is a public route that should be excluded from protection
  const isPublicRoute = publicRoutes.some(route => 
    pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`)
  );

  // If it's a public route, skip authentication checks
  if (isPublicRoute) {
    return intlMiddleware(request);
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(`/${locale}${route}`)
  );

  // Check if this is an admin route (either explicitly in adminRoutes or contains '/admin' and is not a public route)
  const isAdminPath = pathname.startsWith(`/${locale}/admin`);
  const isAdminPublic = publicRoutes.some(route => 
    route.startsWith('/admin') && 
    (pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`))
  );
  const isAdminRoute = isAdminPath && !isAdminPublic;

  // If this is a protected or admin route, check for authentication
  if (isProtectedRoute || isAdminRoute) {
    // 获取JWT token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // If no token, redirect to login page with callbackUrl
    if (!token) {
      // 如果是管理员路由，直接重定向到管理员登录页面
      if (isAdminRoute) {
        const adminLoginUrl = new URL(`/${locale}/admin/login`, request.url);
        adminLoginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(adminLoginUrl);
      }
      
      // 对于普通用户路由，继续使用原有逻辑
      const loginUrl = new URL(`/${locale}/login`, request.url);
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
