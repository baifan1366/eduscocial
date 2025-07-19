import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/serverAuth';

/**
 * GET /api/users/current
 * Returns current authenticated user information
 */
export async function GET(request) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    // If no session, return unauthenticated response
    if (!session) {
      return NextResponse.json({ 
        authenticated: false,
        user: null
      }, { status: 401 });
    }
    
    // Return session data
    return NextResponse.json({
      authenticated: true,
      user: session.user
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving current user session:', error);
    return NextResponse.json({ 
      authenticated: false,
      message: 'Failed to retrieve session',
      error: error.message
    }, { status: 500 });
  }
} 