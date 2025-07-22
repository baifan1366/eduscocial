import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { generateJWT } from '../../../../lib/auth/jwt';
import { storeSession } from '../../../../lib/auth/session';
import { setAuthCookie } from '../../../../lib/auth/cookies';
import { comparePassword } from '../../../../lib/auth/password';

/**
 * Admin login API route
 * POST /api/admin/login
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    const { data: adminUser, error: adminUserError } = await supabase
      .from('admin_users')
      .select('id, email, name, password, role')
      .eq('email', email)
      .single();

    if (adminUserError || !adminUser) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    //create admin_sessions exist or not, if not create it
    const { data: adminSession, error: adminSessionError } = await supabase
      .from('admin_sessions')
      .select('id')
      .eq('admin_user_id', adminUser.id)
      .single();

    if (adminSessionError) {
      console.error('Failed to create admin session:', adminSessionError);
    }

    if (!adminSession) {
      await supabase
        .from('admin_sessions')
        .insert({
          admin_user_id: adminUser.id,
          ip_address: request.ip,
          user_agent: request.headers.get('user-agent'),
          device_info: request.headers.get('sec-ch-ua-platform'),
          location: request.headers.get('cf-ipcountry'),
          is_active: true,
          last_seen: new Date().toISOString()
        });

      if (adminSessionError) {
        console.error('Failed to create admin session:', adminSessionError);
      }
    }

    // Verify password using comparePassword instead of rehashing
    const isPasswordValid = await comparePassword(password, adminUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    

    // Generate JWT token
    const token = await generateJWT({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'admin'
    });

    // Store session in Redis
    await storeSession(adminUser.id, {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'admin'
    });

    // update last seen
    const { data: updatedAdminSession, error: updatedAdminSessionError } = await supabase
      .from('admin_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('admin_user_id', adminUser.id);

    if (updatedAdminSessionError) {
      console.error('Failed to update admin session:', updatedAdminSessionError);
    }

    // Set auth cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin'
      }
    }, { status: 200 });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
