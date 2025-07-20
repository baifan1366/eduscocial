import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractTokenFromRequest } from '@/lib/auth/jwt';
import { blacklistToken } from '@/lib/auth/tokenBlacklist';
import { removeAuthCookie } from '@/lib/auth/cookies';

/**
 * User logout API route
 * POST /api/auth/logout
 */
export async function POST(request) {
  try {
    // Extract token from request headers or cookies
    const token = extractTokenFromRequest(request);
    
    // If token exists, blacklist it
    if (token) {
      try {
        await blacklistToken(token);
        console.log('Token successfully blacklisted during logout');
      } catch (blacklistError) {
        console.error('Error blacklisting token during logout:', blacklistError);
        // Continue with logout even if blacklisting fails
      }
    }
    
    // Execute Supabase logout operation
    const { error } = await supabase.auth.signOut();
    
    // If there's an error with Supabase logout, return error
    if (error) {
      console.error('Supabase logout error:', error);
      return NextResponse.json(
        { error: error.message || 'Logout failed' },
        { status: 400 }
      );
    }
    
    // Create response and remove auth cookie
    const response = NextResponse.json({ 
      message: 'Successfully logged out',
      tokenBlacklisted: !!token 
    });
    
    removeAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Logout route error:', error);
    return NextResponse.json(
      { error: 'Internal server error, please try again later' },
      { status: 500 }
    );
  }
}
