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
    const { businessName, email, password } = await request.json();
    
    // Validate required fields
    if (!businessName || !email || !password) {
      return NextResponse.json({ message: 'Business name, email and password are required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Check if email already exists
    const { data: existingUser, error: userError } = await supabase
      .from('business_users')
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
      .from('business_users')
      .insert({
        email,
        name: businessName,
        password: passwordHash,
        role: 'business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, role, created_at, updated_at')
      .single();

    if (createUserError) {
      console.error('Create user error:', createUserError);
      return NextResponse.json({ message: 'Failed to create user account' }, { status: 500 });
    }

    // Create user_profiles record
    const { error: profileError } = await supabase
      .from('business_profiles')
      .insert({
        business_id: newUser.id,
        company_name: '',
        company_description: '',
        company_location: '',
        company_phone_number: '',
        company_address: '',
        company_city: '',
        company_state: '',
        company_zip_code: '',
        company_country: '',
        daily_active_time: 'varies',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      console.error('Create profile error:', profileError);
      return NextResponse.json({ message: 'Failed to create user profile' }, { status: 500 });
    }

    // Create business services record
    const { data: businessServices, error: businessServicesError } = await supabase
      .from('business_services')
      .insert({
        business_id: newUser.id,
        company_email: email,
        company_facebook: '',
        company_instagram: '',
        company_twitter: '',
        company_linkedin: '',
        company_youtube: '',
      })
      .select('id, business_id, company_email, company_facebook, company_instagram, company_twitter, company_linkedin, company_youtube, created_at, updated_at')
      .single();

    if (businessServicesError) {
      // Rollback user creation if business services creation fails
      await supabase.from('business_users').delete().eq('id', newUser.id);
      console.error('Create business services error:', businessServicesError);
      return NextResponse.json({ message: 'Failed to create business account' }, { status: 500 });
    }

    // Create business credits record
    const { error: businessCreditsError } = await supabase
      .from('business_credits')
      .insert({
        business_user_id: newUser.id
      });

    if (businessCreditsError) {
      console.error('Create business credits error:', businessCreditsError);
      return NextResponse.json({ message: 'Failed to create business credits' }, { status: 500 });
    }

    // Generate JWT token
    const token = await generateJWT({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'business',
    });

    // Store session in Redis
    await storeSession(newUser.id, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'business',
    });

    // Set auth cookie and return response
    const response = NextResponse.json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
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