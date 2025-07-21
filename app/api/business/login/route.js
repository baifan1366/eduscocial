import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { generateJWT } from '../../../../lib/auth/jwt';
import { storeSession } from '../../../../lib/auth/session';
import { setAuthCookie } from '../../../../lib/auth/cookies';
import { comparePassword } from '../../../../lib/auth/password';

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

    // check is the password and email match
    const { data: user, error: userError } = await supabase
    .from('business_users')
    .select('id, email, name, password')
    .eq('email', email)
    .single();

    if (userError || !user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    //create business session
    const { data: businessSession, error: businessSessionError } = await supabase
      .from('business_sessions')
      .insert({
        business_user_id: user.id,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent'),
        device_info: request.headers.get('sec-ch-ua-platform'),
        location: request.headers.get('cf-ipcountry'),
        is_active: true,
        last_seen: new Date().toISOString()
      });

    if (businessSessionError) {
      console.error('Failed to create business session:', businessSessionError);
    }

    // Verify password 
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT token
    const token = await generateJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'business',
    });

    // Store session in Redis
    await storeSession(user.id, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'business',
    });

    // Update user's last login timestamp
    await supabase
      .from('business_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('business_user_id', user.id);

    // Set auth cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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