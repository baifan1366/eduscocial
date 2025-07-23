import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { profileUpdateSchema } from '@/lib/validations/profile';
import { getServerSession } from '@/lib/auth/serverAuth';

// GET handler to retrieve user profile
export async function GET(request, { params }) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can access this profile (own profile or public access)
    if (session.user.id !== id) {
      // For now, only allow users to access their own profile
      // You can modify this logic later to allow public profile access
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query the users table for profile information
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return profile data with camelCase conversion using actual database fields
    const userData = data.admin_users || {};
    
    return NextResponse.json({
      profile: {
        displayName: userData.name || '',
        email: userData.email || '',
        avatarUrl: userData.avatar_url || '',
        phoneNumber: userData.phone_number || '',
        role: userData.role || '',
        createdAt: userData.created_at || '',
        updatedAt: userData.updated_at || '',
        createdBy: userData.created_by || '',
      }
    });
  } catch (error) {
    console.error('Unexpected error in profile GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler to update user profile
export async function PUT(request, { params }) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();
    const { id } = (await params);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can modify this profile (only own profile)
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse the request body
    const body = await request.json();

    // Validate the profile data
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const profileData = validationResult.data;

    // Convert camelCase to snake_case for database and map to user_profiles table fields
    const dbData = {
      name: profileData.name,
      email: profileData.email,
      phone_number: profileData.phoneNumber || '',
      avatar_url: profileData.avatarUrl || '',
      password: profileData.password || '',
      role: profileData.role || '',
      created_at: profileData.createdAt || '',
      updated_at: new Date().toISOString(),
      created_by: profileData.createdBy || '',
    };

    // Remove undefined/null values to avoid database errors
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    // Update the user profile record
    const { error } = await supabase
      .from('admin_users')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('Error saving admin profile:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile saved successfully'
    });
  } catch (error) {
    console.error('Unexpected error in profile PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}