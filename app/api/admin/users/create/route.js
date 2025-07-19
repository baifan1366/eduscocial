import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../../lib/supabase';
import { getServerSession, hasRequiredRole } from '../../../../../lib/auth/serverAuth';
import { hashPassword } from '../../../../../lib/auth/password';

/**
 * Create admin user API route
 * POST /api/admin/users/create
 * Only accessible by superadmins
 */
export async function POST(request) {
  try {
    // Check if the current user is authenticated and has superadmin role
    const session = await getServerSession();
    
    if (!session || !hasRequiredRole(session, 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    
    const { email, username, displayName, password, role } = await request.json();
    
    // Validate required fields
    if (!email || !username || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate admin role
    const validRoles = ['support', 'ads_manager', 'superadmin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if email or username already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'Email or username already in use' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        display_name: displayName || username,
        password_hash: passwordHash,
        created_by: session.user.id
      })
      .select('id')
      .single();

    if (createUserError) {
      console.error('Create admin user error:', createUserError);
      return NextResponse.json({ message: 'Failed to create user account' }, { status: 500 });
    }

    // Create admin record
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: newUser.id,
        role,
        created_by: session.user.id
      })
      .select()
      .single();

    if (adminError) {
      // Rollback user creation if admin creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      console.error('Create admin record error:', adminError);
      return NextResponse.json({ message: 'Failed to create admin account' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      admin: {
        id: adminUser.id,
        user_id: newUser.id,
        role: adminUser.role
      } 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 