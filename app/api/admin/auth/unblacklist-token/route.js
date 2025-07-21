import { NextResponse } from 'next/server';
import { getServerSession, hasRequiredRole, adminRemoveFromBlacklist } from '../../../../../lib/auth/serverAuth';
import { verifyJWT } from '../../../../../lib/auth/jwt';

/**
 * Administrative endpoint to remove a specific JWT token from blacklist
 * POST /api/admin/auth/unblacklist-token
 * 
 * Required permissions: super_admin only (token restoration is a sensitive operation)
 * 
 * Request body:
 * {
 *   token: string,     // JWT token to remove from blacklist
 *   reason?: string    // Optional reason for removal
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
    
    // Check if user has super admin privileges (token restoration requires highest permissions)
    if (!hasRequiredRole(session, 'super_admin')) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Super admin privileges required for token restoration' },
        { status: 403 }
      );
    }
    
    const { token, reason = 'admin_token_restoration' } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Validate token format before attempting removal
    try {
      await verifyJWT(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid token format' },
        { status: 400 }
      );
    }
    
    // Remove token from blacklist
    const wasRemoved = await adminRemoveFromBlacklist(token, session.user.id, reason);
    
    if (!wasRemoved) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Token was not found in blacklist',
          action: {
            type: 'TOKEN_NOT_FOUND',
            performedBy: {
              id: session.user.id,
              email: session.user.email,
              role: session.user.role
            },
            reason,
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      );
    }
    
    // Log the administrative action
    console.log(`Admin token restoration: Token removed from blacklist by ${session.user.email} (${session.user.id}) - Reason: ${reason}`);
    
    return NextResponse.json({
      success: true,
      message: 'Token successfully removed from blacklist',
      action: {
        type: 'TOKEN_RESTORED',
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
    console.error('Admin unblacklist token error:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Failed to remove token from blacklist',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}