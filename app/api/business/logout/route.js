import { NextResponse } from 'next/server';
import { getAuthCookie, removeAuthCookie } from '../../../../lib/auth/cookies';
import { verifyJWT } from '../../../../lib/auth/jwt';
import { deleteSession } from '../../../../lib/auth/session';

/**
 * Business logout API route
 * POST /api/business/logout
 */
export async function POST(request) {
  try {
    // Get the auth token
    const token = getAuthCookie();
    
    if (token) {
      try {
        // Verify token to get user ID
        const decoded = await verifyJWT(token);
        
        if (decoded && decoded.id) {
          // Delete session from Redis
          await deleteSession(decoded.id);
        }
      } catch (error) {
        console.error('Error verifying token during logout:', error);
        // Continue with logout even if token verification fails
      }
    }
    
    // Create response and remove cookie
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    removeAuthCookie(response);
    
    return response;
  } catch (error) {
    console.error('Business logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 