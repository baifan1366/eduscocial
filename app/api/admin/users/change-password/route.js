import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession, hasRequiredRole } from '@/lib/auth/serverAuth';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { blacklistUserTokens } from '@/lib/auth/tokenBlacklist';

/**
 * POST /api/admin/users/change-password
 * Admin endpoint to change user password and blacklist all existing tokens
 */
export async function POST(request) {
  try {
    // Get authenticated admin session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const hasAdminRole = await hasRequiredRole(session.user.id, ['admin', 'super_admin']);
    if (!hasAdminRole) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { userId, newPassword, reason } = await request.json();

    // Validate required fields
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Get target user from database
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating password (admin):', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Blacklist all existing tokens for the target user
    try {
      const blacklistedCount = await blacklistUserTokens(
        userId, 
        `admin_password_change_by_${session.user.id}`
      );
      
      console.log(`Admin ${session.user.id} changed password for user ${userId}, blacklisted ${blacklistedCount} tokens`);
    } catch (blacklistError) {
      console.error('Error blacklisting tokens after admin password change:', blacklistError);
      // Continue with success response even if blacklisting fails
    }

    // Log the admin action for audit purposes
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: session.user.id,
          action: 'password_change',
          target_user_id: userId,
          details: {
            reason: reason || 'No reason provided',
            target_email: targetUser.email,
            target_username: targetUser.username
          },
          created_at: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Error logging admin action:', auditError);
      // Continue with success response even if audit logging fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Password changed successfully for user ${targetUser.username || targetUser.email}. User will need to log in again.`,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username
      },
      requiresReauth: true
    });

  } catch (error) {
    console.error('Unexpected error in admin password change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}