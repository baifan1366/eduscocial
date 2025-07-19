import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { generateJWT } from '../../../../lib/auth/jwt';
import { storeSession } from '../../../../lib/auth/session';
import { setAuthCookie } from '../../../../lib/auth/cookies';
import { hashPassword } from '../../../../lib/auth/password';

/**
 * Business login API route
 * POST /api/business/login
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, display_name, password_hash')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Check if this is a business account
    const { data: advertiser, error: advertiserError } = await supabase
      .from('advertisers')
      .select('id')
      .eq('contact_email', email)
      .single();

    if (advertiserError || !advertiser) {
      return NextResponse.json({ message: 'Not a valid business account' }, { status: 403 });
    }

    // Verify password
    const hashedInputPassword = await hashPassword(password);
    if (user.password_hash !== hashedInputPassword) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token
    const token = await generateJWT({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.display_name || user.username,
      role: 'business',
      advertiserId: advertiser.id
    });

    // Store session in Redis
    await storeSession(user.id, {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      role: 'business',
      advertiserId: advertiser.id
    });

    // Update user's last login timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Set auth cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name || user.username,
        role: 'business'
      }
    }, { status: 200 });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Business login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 