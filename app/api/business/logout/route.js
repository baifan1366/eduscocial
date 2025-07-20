import { NextResponse } from 'next/server';
import { getAuthCookie, removeAuthCookie } from '../../../../lib/auth/cookies';
import { verifyJWT, extractTokenFromRequest } from '../../../../lib/auth/jwt';
import { deleteSession } from '../../../../lib/auth/session';
import { blacklistToken } from '../../../../lib/auth/tokenBlacklist';

/**
 * Business logout API route
 * POST /api/business/logout
 */
export async function POST(request) {
  try {
    // Extract token from request headers or cookies
    let token = extractTokenFromRequest(request);
    
    // Fallback to getAuthCookie for backward compatibility
    if (!token) {
      token = getAuthCookie();
    }
    
    if (token) {
      try {
        // Blacklist the token immediately
        await blacklistToken(token);
        console.log('Business token successfully blacklisted during logout');
        
        // Verify token to get user ID for session cleanup
        const decoded = await verifyJWT(token);
        
        if (decoded && decoded.id) {
          // Delete session from Redis
          await deleteSession(decoded.id);
        }
      } catch (error) {
        console.error('Error processing token during business logout:', error);
        // Continue with logout even if token processing fails
      }
    }
    
    // Create response and remove cookie
    const response = NextResponse.json({ 
      message: 'Business logout successful',
      tokenBlacklisted: !!token 
    }, { status: 200 });
    
    removeAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Business logout error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Business logout failed' 
    }, { status: 500 });
  }
} 