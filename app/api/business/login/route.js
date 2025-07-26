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
    
    const { data: businessUser, error: businessUserError } = await supabase
      .from('business_users')
      .select('id, email, name, password, role')
      .eq('email', email)
      .single();

    if (businessUserError || !businessUser) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    //create business_sessions exist or not, if not create it
    const { data: businessSessions, error: businessSessionsError } = await supabase
      .from('business_sessions')
      .select('id')
      .eq('business_user_id', businessUser.id);

    if (businessSessionsError) {
      console.error('Failed to query business sessions:', businessSessionsError);
    }

    // 检查是否存在会话
    if (!businessSessions || businessSessions.length === 0) {
      const { error: insertError } = await supabase
        .from('business_sessions')
        .insert({
          business_user_id: businessUser.id,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          device_info: request.headers.get('sec-ch-ua-platform'),
          location: request.headers.get('cf-ipcountry'),
          is_active: true,
          last_seen: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to create business session:', insertError);
      }
    }

    // Verify password using comparePassword instead of rehashing
    const isPasswordValid = await comparePassword(password, businessUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Generate JWT token
    const token = await generateJWT({
      id: businessUser.id,
      email: businessUser.email,
      name: businessUser.name,
      role: 'business'
    });

    // Store session in Redis
    await storeSession(businessUser.id, {
      id: businessUser.id,
      email: businessUser.email,
      name: businessUser.name,
      role: 'business'
    });

    // update last seen
    const { error: updatedBusinessSessionError } = await supabase
      .from('business_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('business_user_id', businessUser.id);

    if (updatedBusinessSessionError) {
      console.error('Failed to update business session:', updatedBusinessSessionError);
    }

    // Set auth cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: businessUser.id,
        email: businessUser.email,
        name: businessUser.name,
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