import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase';
import { generateJWT } from '../../../../lib/auth/jwt';
import { storeSession } from '../../../../lib/auth/session';
import { setAuthCookie } from '../../../../lib/auth/cookies';
import { hashPassword } from '../../../../lib/auth/password';

/**
 * Business registration API route
 * POST /api/business/register
 */
export async function POST(request) {
  try {
    const { name, email, password, contactPhone, description } = await request.json();
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if email already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user record
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        email,
        username: email.split('@')[0], // Generate username from email
        password_hash: passwordHash,
        is_active: true,
        is_verified: true,
        gender: 'other', // Default value
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, username')
      .single();

    if (createUserError) {
      console.error('Create user error:', createUserError);
      return NextResponse.json({ message: 'Failed to create user account' }, { status: 500 });
    }

    // Create user_profiles record
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        interests: '',
        relationship_status: 'prefer_not_to_say',
        favorite_quotes: '',
        favorite_country: '',
        daily_active_time: 'varies',
        study_abroad: 'no',
        leisure_activities: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      console.error('Create profile error:', profileError);
      return NextResponse.json({ message: 'Failed to create user profile' }, { status: 500 });
    }

    // Create advertiser record
    const { data: advertiser, error: advertiserError } = await supabase
      .from('advertisers')
      .insert({
        name,
        contact_email: email,
        contact_phone: contactPhone || '',
        created_by: newUser.id
      })
      .select('id')
      .single();

    if (advertiserError) {
      // Rollback user creation if advertiser creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      console.error('Create advertiser error:', advertiserError);
      return NextResponse.json({ message: 'Failed to create business account' }, { status: 500 });
    }

    // Generate JWT token
    const token = await generateJWT({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: 'business',
      advertiserId: advertiser.id
    });

    // Store session in Redis
    await storeSession(newUser.id, {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: 'business',
      advertiserId: advertiser.id
    });

    // Set auth cookie and return response
    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: 'business'
      }
    }, { status: 201 });

    setAuthCookie(response, token);
    
    return response;
  } catch (error) {
    console.error('Business registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 