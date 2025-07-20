import { NextResponse } from 'next/server';
import { getServerSession, hasRequiredRole, adminBlacklistToken } from '../../../../../lib/auth/serverAuth';
import { verifyJWT } from '../../../../../lib/auth/jwt';

/**
 * Administrative endpoint to blacklist a specific JWT token
 * POST /api/admin/auth/blacklist-token
 * 
 * Required permissions: admin or super_admin
 * 
 * Request body:
 * {
 *   token: string,     // JWT token to blacklist
 *   reason?: string    // Optional reason for blacklisting
 * }
 */
export async function POST(request) {
  try {
    // Get admin session
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin privileges
    if (!hasRequiredRole(session, ['admin', 'super_admin'])) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    const { token, reason = 'admin_blacklist' } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Validate token format before blacklisting
    try {
      await verifyJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid token format' },
        { status: 400 }
      );
    }
    
    // Blacklist the token
    await adminBlacklistToken(token, session.user.id, reason);
    
    // Log the administrative action
    console.log(`Admin blacklist action: Token blacklisted by ${session.user.email} (${session.user.id}) - Reason: ${reason}`);
    
    return NextResponse.json({
      success: true,
      message: 'Token successfully blacklisted',
      action: {
        type: 'TOKEN_BLACKLISTED',
        performedBy: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        reason,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin blacklist token error:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Failed to blacklist token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}