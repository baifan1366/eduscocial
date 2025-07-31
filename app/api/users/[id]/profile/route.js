import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { profileUpdateSchema } from '@/lib/validations/profile';
import { getServerSession } from '@/lib/auth/serverAuth';
import { trackProfileUpdate } from '@/lib/userEmbedding';

// GET handler to retrieve user profile
export async function GET(request, { params }) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession();
    const { id: userId } = await params;

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
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return profile data with camelCase conversion using actual database fields
    const userData = data.users?.user_profiles_user_id_fkey || {};
    
    return NextResponse.json({
      profile: {
        displayName: userData.username || '',
        email: userData.email || '',
        gender: userData.gender || '',
        bio: data.bio || '',
        birthday: data.birthday ? new Date(data.birthday).toISOString() : null,
        interests: data.interests || '',
        university: data.university || '',
        relationshipStatus: data.relationship_status || 'prefer_not_to_say',
        favoriteQuotes: data.favorite_quotes || '',
        favoriteCountry: data.favorite_country || '',
        dailyActiveTime: data.daily_active_time || 'varies',
        studyAbroad: data.study_abroad || 'no',
        leisureActivities: data.leisure_activities || '',
        avatarUrl: userData.avatar_url || ''
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
    const { id: userId } = (await params);

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

    // 获取旧的个人资料数据用于跟踪变更
    const { data: oldProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Convert camelCase to snake_case for database and map to user_profiles table fields
    const dbData = {
      bio: profileData.bio,
      university: profileData.university,
      birthday: profileData.birthday ? new Date(profileData.birthday) : null,
      interests: profileData.interests || '',
      relationship_status: profileData.relationshipStatus || 'prefer_not_to_say',
      favorite_quotes: profileData.favoriteQuotes || '',
      favorite_country: profileData.favoriteCountry || '',
      daily_active_time: profileData.dailyActiveTime || 'varies',
      study_abroad: profileData.studyAbroad || 'no',
      leisure_activities: profileData.leisureActivities || '',
      updated_at: new Date().toISOString()
    };

    // Remove undefined/null values to avoid database errors
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    // Update the avatar_url and gender in the users table
    if (profileData.avatarUrl !== undefined || profileData.gender !== undefined) {
      const userUpdateData = {
        updated_at: new Date().toISOString()
      };
      
      if (profileData.avatarUrl !== undefined) {
        userUpdateData.avatar_url = profileData.avatarUrl;
      }
      
      if (profileData.gender !== undefined) {
        userUpdateData.gender = profileData.gender;
      }
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', userId);
      
      if (userUpdateError) {
        console.error('Error updating user data:', userUpdateError);
        return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
      }
    }

    // Update the user profile record
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(dbData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving user profile:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // 跟踪个人资料更新以触发嵌入向量更新
    try {
      await trackProfileUpdate(userId, oldProfile, updatedProfile);
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