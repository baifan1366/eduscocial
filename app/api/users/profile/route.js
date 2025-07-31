import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';
import { profileSchema, profileUpdateSchema } from '@/lib/validations/profile';
import { trackProfileUpdate } from '@/lib/userEmbedding';

// GET handler to retrieve user profile
export async function GET(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query the users table for profile information
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        bio,
        university,
        birthday,
        interests,
        relationship_status,
        favorite_quotes,
        favorite_country,
        daily_active_time,
        study_abroad,
        leisure_activities,
        users!user_profiles_user_id_fkey (
          username,
          email,
          avatar_url,
          gender
        )
      `)
      .eq('user_id', session.user.id)
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
      .eq('user_id', session.user.id);

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
        bio: data.bio || '',
        birthday: data.birthday ? data.birthday.toString() : null, // Convert birth_year to string
        interests: interests, // From user_interests table
        university: data.university || '',
        relationshipStatus: data.relationship_status || '',
        favoriteQuotes: data.favorite_quotes || '',
        favoriteCountry: data.favorite_country || '',
        dailyActiveTime: data.daily_active_time || '',
        studyAbroad: data.study_abroad || '',
        leisureActivities: data.leisure_activities || '',
        avatarUrl: data.users?.user_profiles_user_id_fkey?.avatar_url || '',
        gender: data.users?.user_profiles_user_id_fkey?.gender || ''
      }
    });
  } catch (error) {
    console.error('Unexpected error in profile GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler to update user profile
export async function PUT(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // 获取旧的用户数据用于跟踪变更
    const { data: oldUserData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Convert camelCase to snake_case for database and map to users table fields
    const dbData = {
      username: profileData.displayName,
      bio: profileData.bio,
      university: profileData.university, // Map university to school field
      department: profileData.department,
      birthday: profileData.birthday ? parseInt(profileData.birthday) : null, // Convert birthday string to birth_year integer
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

    // Update the user record directly
    const { data: updatedUserData, error } = await supabase
      .from('users')
      .update(dbData)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error saving user profile:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // 跟踪个人资料更新以触发嵌入向量更新
    try {
      await trackProfileUpdate(session.user.id, oldUserData, updatedUserData);
    } catch (trackingError) {
      // 跟踪失败不应该影响主要功能
      console.error('Error tracking profile update:', trackingError);
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