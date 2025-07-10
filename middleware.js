import createIntlMiddleware from 'next-intl/middleware';

// 创建国际化中间件
const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'zh', 'my'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request) {
    // For non-API routes, apply internationalization middleware
    return intlMiddleware(request);
}

// 更新 matcher 配置以包含更多特定路径
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png|.*\\.webp|.*\\.glb|favicon.ico).*)',
    '/:locale(en|zh|my)/:path*'
  ]
};
