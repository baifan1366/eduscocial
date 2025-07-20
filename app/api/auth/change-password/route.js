import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { comparePassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { blacklistUserTokens } from '@/lib/auth/tokenBlacklist';

/**
 * POST /api/auth/change-password
 * Changes user password and blacklists all existing tokens
 */
export async function POST(request) {
  try {
    // Get authenticated user session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to change password' },
        { status: 401 }
      );
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
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

    // Get user's current password hash from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', session.user.id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user for password change:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await comparePassword(newPassword, user.password_hash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
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
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Blacklist all existing tokens for this user
    try {
      const blacklistedCount = await blacklistUserTokens(
        session.user.id, 
        'password_change'
      );
      
      console.log(`Password changed for user ${session.user.id}, blacklisted ${blacklistedCount} tokens`);
    } catch (blacklistError) {
      console.error('Error blacklisting tokens after password change:', blacklistError);
      // Continue with success response even if blacklisting fails
      // The password was successfully changed
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
      requiresReauth: true
    });

  } catch (error) {
    console.error('Unexpected error in password change:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}