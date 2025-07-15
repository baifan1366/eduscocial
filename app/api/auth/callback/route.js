import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Handle post-login redirects to ensure users land in the correct place after OAuth
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl');
    
    console.log('Auth callback - Session exists:', !!session);
    console.log('Auth callback - Original callbackUrl:', callbackUrl);
    
    // Get locale from URL path or default to 'en'
    const locale = url.pathname.split('/')[1] || 'en';
    
    if (session) {
      // User is authenticated, redirect to callback URL or homepage
      if (callbackUrl) {
        // Simple validation to prevent open redirect
        if (callbackUrl.startsWith('/') || callbackUrl.startsWith(url.origin)) {
          console.log('Auth callback - Redirecting to:', callbackUrl);
          return NextResponse.redirect(new URL(callbackUrl, request.url));
        }
      }
      
      // Default to homepage with locale
      console.log('Auth callback - Redirecting to homepage with locale:', `/${locale}`);
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    } else {
      // No session, redirect to login page
      console.log('Auth callback - No session, redirecting to login');
      
      // If there was a callback URL, preserve it
      if (callbackUrl) {
        const encodedCallback = encodeURIComponent(callbackUrl);
        return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${encodedCallback}`, request.url));
      }
      
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 