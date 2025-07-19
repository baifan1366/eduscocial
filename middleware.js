import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { verifyJWT, isTokenValid } from './lib/auth/jwt';

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
  '/my',
];

// List of admin-only routes that require admin authentication
const adminRoutes = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/settings',
];

// List of business-only routes that require business authentication
const businessRoutes = [
  '/business/dashboard',
  '/business/profile',
  '/business/settings',
  '/business/analytics',
];

// List of public routes that should be excluded from protection
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/admin/login',
  '/business/login',
  '/error',
];

// 用于记录重定向次数的cookie名称
const REDIRECT_COUNT_COOKIE = 'redirect_count';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const locale = request.nextUrl.locale || 'en';
  
  // Bypass middleware for static assets and API routes
  if (pathname.includes('/api/') || 
      pathname.includes('/_next/') ||
      pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|js|glb)$/)) {
    return NextResponse.next();
  }
  
  // 检查是否存在重定向计数cookie
  const redirectCountCookie = request.cookies.get(REDIRECT_COUNT_COOKIE);
  const redirectCount = redirectCountCookie ? parseInt(redirectCountCookie.value) : 0;
  
  // 如果重定向次数过多，可能存在循环，返回错误页面
  if (redirectCount > 2) {
    // 创建新响应，清除重定向计数
    console.error(`Redirect loop detected for path: ${pathname}`);
    const response = NextResponse.redirect(new URL(`/${locale}/error?code=redirect_loop&from=${encodeURIComponent(pathname)}`, request.url));
    response.cookies.delete(REDIRECT_COUNT_COOKIE);
    return response;
  }
  
  // Check if this is a public route that should be excluded from protection
  const isPublicRoute = publicRoutes.some(route => 
    pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`)
  );

  // If it's a public route, skip authentication checks and reset counter
  if (isPublicRoute) {
    const response = intlMiddleware(request);
    response.cookies.delete(REDIRECT_COUNT_COOKIE);
    return response;
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(`/${locale}${route}`)
  );

  // Check if this is an admin route
  const isAdminPath = pathname.startsWith(`/${locale}/admin`);
  const isAdminPublic = publicRoutes.some(route => 
    route.startsWith('/admin') && 
    (pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`))
  );
  const isAdminRoute = isAdminPath && !isAdminPublic;

  // Check if this is a business route
  const isBusinessPath = pathname.startsWith(`/${locale}/business`);
  const isBusinessPublic = publicRoutes.some(route => 
    route.startsWith('/business') && 
    (pathname === `/${locale}${route}` || pathname.startsWith(`/${locale}${route}/`))
  );
  const isBusinessRoute = isBusinessPath && !isBusinessPublic;

  // 如果这是一个需要保护的路由，检查身份验证
  if (isProtectedRoute || isAdminRoute || isBusinessRoute) {
    // 获取JWT token
    const authToken = request.cookies.get('auth_token')?.value;
    
    let tokenData = null;
    if (authToken) {
      const decoded = await verifyJWT(authToken);
      if (isTokenValid(decoded)) {
        tokenData = decoded;
      }
    }
    
    // 如果没有token，重定向到登录页面
    if (!tokenData) {
      // 避免相同URL的重复重定向
      const referer = request.headers.get('referer');
      const currentUrl = request.url;
      
      // 如果当前URL与来源URL相同，可能存在循环
      if (referer === currentUrl) {
        return NextResponse.redirect(new URL(`/${locale}/error?code=auth_required`, request.url));
      }
      
      // 选择重定向目标
      let redirectUrl;
      if (isAdminRoute) {
        redirectUrl = new URL(`/${locale}/admin/login`, request.url);
      } else if (isBusinessRoute) {
        redirectUrl = new URL(`/${locale}/business/login`, request.url);
      } else {
        redirectUrl = new URL(`/${locale}/login`, request.url);
      }
      
      // 简化callback URL - 只存储路径部分，避免URL变得过长
      const currentPath = new URL(request.url).pathname;
      redirectUrl.searchParams.set('callbackUrl', currentPath);
      
      // 创建响应并增加重定向计数
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set({
        name: REDIRECT_COUNT_COOKIE,
        value: String(redirectCount + 1),
        path: '/',
        maxAge: 60, // 1分钟过期
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // 如果有token，通过国际化中间件并重置计数器
    const response = intlMiddleware(request);
    response.cookies.delete(REDIRECT_COUNT_COOKIE);
    
    // 检查管理员权限
    if (isAdminRoute && tokenData.role !== 'ADMIN') {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }
    
    // 检查商家权限
    if (isBusinessRoute && tokenData.role !== 'business') {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url)
      );
    }
    
    return response;
  }

  // 对于所有其他路由，应用国际化中间件
  const response = intlMiddleware(request);
  // 重置重定向计数
  response.cookies.delete(REDIRECT_COUNT_COOKIE);
  return response;
}

// 更新 matcher 配置
export const config = {
  matcher: [
    // Match all paths except explicitly excluded ones
    '/((?!api|_next|favicon.ico).*)',
    // Match locale paths
    '/:locale(en|zh|my)/:path*'
  ]
};
