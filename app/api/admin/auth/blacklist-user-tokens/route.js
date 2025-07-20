import { NextResponse } from 'next/server';
import { getServerSession, hasRequiredRole, blacklistAllUserTokens } from '../../../../../lib/auth/serverAuth';
import { createServerSupabaseClient } from '../../../../../lib/supabase';

/**
 * Administrative endpoint to blacklist all tokens for a specific user
 * POST /api/admin/auth/blacklist-user-tokens
 * 
 * Required permissions: admin or super_admin
 * 
 * Request body:
 * {
 *   userId: string,    // User ID whose tokens should be blacklisted
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
    
    const { userId, reason = 'admin_user_blacklist' } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Verify that the user exists
    const supabase = createServerSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent admins from blacklisting their own tokens unless they're super_admin
    if (userId === session.user.id && session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Cannot blacklist your own tokens. Super admin privileges required.' },
        { status: 403 }
      );
    }
    
    // Blacklist all user tokens
    const blacklistedCount = await blacklistAllUserTokens(userId, reason);
    
    // Log the administrative action
    console.log(`Admin user blacklist action: All tokens for user ${user.email} (${userId}) blacklisted by ${session.user.email} (${session.user.id}) - Reason: ${reason} - Count: ${blacklistedCount}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully blacklisted ${blacklistedCount} tokens for user`,
      action: {
        type: 'USER_TOKENS_BLACKLISTED',
        targetUser: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        performedBy: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        tokensBlacklisted: blacklistedCount,
        reason,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin blacklist user tokens error:', error);
    
    return NextResponse.json(
      { 
        error: 'INTERNAL_ERROR', 
        message: 'Failed to blacklist user tokens',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}