import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { profileUpdateSchema } from '@/lib/validations/profile';

// GET handler to retrieve user profile
export async function GET(request, { params }) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can access this profile (own profile or public access)
    if (session.user.id !== userId) {
      // For now, only allow users to access their own profile
      // You can modify this logic later to allow public profile access
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query the users table for profile information
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        display_name,
        bio,
        school,
        department,
        birth_year,
        avatar_url,
        country
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Fetch user interests from user_interests table
    const { data: interestsData, error: interestsError } = await supabase
      .from('user_interests')
      .select(`
        hashtags(name),
        topics(name)
      `)
      .eq('user_id', userId);

    // Process interests data
    let interests = '';
    if (!interestsError && interestsData) {
      const interestNames = interestsData.map(item => {
        return item.hashtags?.name || item.topics?.name;
      }).filter(Boolean);
      interests = interestNames.join(', ');
    }

    // Return profile data with camelCase conversion using actual database fields
    return NextResponse.json({
      profile: {
        displayName: data.display_name || '',
        bio: data.bio || '',
        birthday: data.birth_year ? data.birth_year.toString() : null,
        interests: interests,
        university: data.school || '',
        department: data.department || '',
        avatarUrl: data.avatar_url || '',
        country: data.country || ''
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
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can modify this profile (only own profile)
    if (session.user.id !== userId) {
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

    // Convert camelCase to snake_case for database and map to users table fields
    const dbData = {
      display_name: profileData.displayName,
      bio: profileData.bio,
      school: profileData.university,
      department: profileData.department,
      birth_year: profileData.birthday ? parseInt(profileData.birthday) : null,
      avatar_url: profileData.avatarUrl,
      country: profileData.country,
      updated_at: new Date().toISOString()
    };

    // Remove undefined/null values to avoid database errors
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    // Update the user record
    const { error } = await supabase
      .from('users')
      .update(dbData)
      .eq('id', userId);

    if (error) {
      console.error('Error saving user profile:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully'
    });
  } catch (error) {
    console.error('Unexpected error in profile PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}