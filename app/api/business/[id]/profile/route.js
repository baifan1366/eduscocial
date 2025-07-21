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
      .from('business_profiles')
      .select(`
        id,
        business_id,
        company_name,
        company_description,
        company_location,
        company_country,
        company_city,
        company_address,
        company_zip_code ,
        company_phone_number ,   
        daily_active_time,
        business_users!business_profiles_business_id_fkey (
          name,
          email,
          phone_number,
          password,
          role,
          avatar_url
        )
      `)
      .eq('business_id', id)
      .single();

    if (error) {
      console.error('Error fetching business profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return profile data with camelCase conversion using actual database fields
    const businessData = data.business_profiles?.business_users_business_id_fkey || {};
    
    return NextResponse.json({
      profile: {
        name: businessData.name || '',
        email: businessData.email || '',
        phone_number: businessData.phone_number || '',
        password: businessData.password || '',
        role: businessData.role || '',
        avatar_url: businessData.avatar_url || '',
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        company_location: data.company_location || '',
        company_country: data.company_country || '',
        company_city: data.company_city || '',
        company_address: data.company_address || '',
        company_zip_code: data.company_zip_code || '',
        company_phone_number: data.company_phone_number || '',
        daily_active_time: data.daily_active_time || '',
      }
    });
  } catch (error) {
    console.error('Unexpected error in business profile GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler to update business profile
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
      phone_number: profileData.phone_number,
      password: profileData.password,
      role: profileData.role,
      avatar_url: profileData.avatar_url,
      company_name: profileData.company_name,
      company_description: profileData.company_description,
      company_location: profileData.company_location,
      company_country: profileData.company_country,
      company_city: profileData.company_city,
      company_address: profileData.company_address,
      company_zip_code: profileData.company_zip_code,
      company_phone_number: profileData.company_phone_number,
      daily_active_time: profileData.daily_active_time,
      updated_at: new Date().toISOString()
    };

    // Remove undefined/null values to avoid database errors
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    // Update the avatar_url, name, email, password, role, phone_number in the business_users table
    if (profileData.avatar_url !== undefined || profileData.role !== undefined) {
      const businessUpdateData = {
        updated_at: new Date().toISOString()
      };
      
      if (profileData.avatar_url !== undefined) {
        businessUpdateData.avatar_url = profileData.avatar_url;
      }
      
      if (profileData.role !== undefined) {
        businessUpdateData.role = profileData.role;
      }

      if (profileData.name !== undefined) {
        businessUpdateData.name = profileData.name;
      }

      if (profileData.email !== undefined) {
        businessUpdateData.email = profileData.email;
      } 

      if (profileData.phone_number !== undefined) {
        businessUpdateData.phone_number = profileData.phone_number;
      }

      if (profileData.password !== undefined) {
        businessUpdateData.password = profileData.password;
      }

      const { error: businessUpdateError } = await supabase
        .from('business_users')
        .update(businessUpdateData)
        .eq('id', id);
      
      if (businessUpdateError) {
        console.error('Error updating business data:', businessUpdateError);
        return NextResponse.json({ error: 'Failed to update business data' }, { status: 500 });
      }
    }

    // Update the business profile record
    const { error: businessProfileUpdateError } = await supabase
      .from('business_profiles')
      .update(dbData)
      .eq('business_id', id);

    if (businessProfileUpdateError) {
      console.error('Error saving business profile:', businessProfileUpdateError);
      return NextResponse.json({ error: 'Failed to save business profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Business profile saved successfully'
    });
  } catch (error) {
    console.error('Unexpected error in business profile PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}