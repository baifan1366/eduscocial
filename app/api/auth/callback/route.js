import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handle post-login redirects to ensure users land in the correct place after OAuth
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    
    if (session) {
      // User is authenticated, redirect to callback URL or homepage
      const redirectUrl = callbackUrl || '/';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      // No session, redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 