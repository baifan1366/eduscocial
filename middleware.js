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
  '/my',
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
  '/error',
];

// 用于记录重定向次数的cookie名称
const REDIRECT_COUNT_COOKIE = 'redirect_count';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const locale = request.nextUrl.locale || 'en';
  
  // 检查是否存在重定向计数cookie
  const redirectCountCookie = request.cookies.get(REDIRECT_COUNT_COOKIE);
  const redirectCount = redirectCountCookie ? parseInt(redirectCountCookie.value) : 0;
  
  // 如果重定向次数过多，可能存在循环，返回错误页面
  if (redirectCount > 3) {
    // 创建新响应，清除重定向计数
    const response = NextResponse.redirect(new URL(`/${locale}/error?code=redirect_loop`, request.url));
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

  // 如果这是一个需要保护的路由，检查身份验证
  if (isProtectedRoute || isAdminRoute) {
    // 获取JWT token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // 如果没有token，重定向到登录页面
    if (!token) {
      // 检查请求URL，避免循环重定向
      const requestUrl = new URL(request.url);
      const callbackParam = requestUrl.searchParams.get('callbackUrl');
      
      // 如果URL包含login和callbackUrl指向受保护页面，可能是循环
      if (pathname.includes('/login') && callbackParam && 
          protectedRoutes.some(route => callbackParam.includes(`/${locale}${route}`))) {
        // 这可能是循环重定向，发送到错误页面
        return NextResponse.redirect(new URL(`/${locale}/error?code=auth_required`, request.url));
      }
      
      // 选择重定向目标
      let redirectUrl;
      if (isAdminRoute) {
        redirectUrl = new URL(`/${locale}/admin/login`, request.url);
      } else {
        redirectUrl = new URL(`/${locale}/login`, request.url);
      }
      
      redirectUrl.searchParams.set('callbackUrl', request.url);
      
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
    if (isAdminRoute && token.role !== 'ADMIN') {
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

// 更新 matcher 配置以包含更多特定路径
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png|.*\\.webp|.*\\.svg|.*\\.glb|favicon.ico).*)',
    '/:locale(en|zh|my)/:path*'
  ]
};
