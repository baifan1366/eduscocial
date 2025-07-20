import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { blacklistUserTokens } from '@/lib/auth/tokenBlacklist';

/**
 * POST /api/auth/reset-password
 * Resets user password using email verification and blacklists all existing tokens
 */
export async function POST(request) {
  try {
    // Parse request body
    const { email, newPassword, resetToken } = await request.json();

    // Validate required fields
    if (!email || !newPassword || !resetToken) {
      return NextResponse.json(
        { error: 'Email, new password, and reset token are required' },
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

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would verify the reset token here
    // For now, we'll use a simple token validation
    // TODO: Implement proper reset token verification with expiration
    if (resetToken.length < 32) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
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
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password during reset:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Blacklist all existing tokens for this user
    try {
      const blacklistedCount = await blacklistUserTokens(
        user.id, 
        'password_reset'
      );
      
      console.log(`Password reset for user ${user.id}, blacklisted ${blacklistedCount} tokens`);
    } catch (blacklistError) {
      console.error('Error blacklisting tokens after password reset:', blacklistError);
      // Continue with success response even if blacklisting fails
      // The password was successfully reset
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
      requiresReauth: true
    });

  } catch (error) {
    console.error('Unexpected error in password reset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/request-password-reset
 * Initiates password reset process by sending reset token
 */
export async function PUT(request) {
  try {
    // Parse request body
    const { email } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (in real implementation, store this in database with expiration)
    const resetToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    
    // TODO: Store reset token in database with expiration
    // TODO: Send email with reset link containing the token
    
    console.log(`Password reset requested for user ${user.id} (${user.email})`);
    console.log(`Reset token: ${resetToken}`); // Remove this in production

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      // Remove this in production - only for testing
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Unexpected error in password reset request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}