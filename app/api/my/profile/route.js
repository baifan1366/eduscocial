import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';
import { trackProfileUpdate } from '@/lib/userEmbedding';

// GET handler to retrieve user profile
export async function GET(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            console.log('No session or user ID found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Fetching profile for user:', session.user.id);

        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            console.error('Supabase error fetching profile:', error);
            // If no profile exists (PGRST116), return null profile instead of error
            if (error.code === 'PGRST116') {
                console.log('No profile found for user, returning null');
                return NextResponse.json({ profile: null });
            }
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        console.log('Profile fetched successfully:', profile ? 'found' : 'null');
        return NextResponse.json({ profile: profile || null });
    } catch (error) {
        console.error('Unexpected error in profile GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST handler to update user profile
export async function POST(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { profile } = body;

        if (!profile) {
            return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });
        }

        // 获取旧的个人资料数据用于跟踪变更
        const { data: oldProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        // Prepare profile data with required fields
        const profileData = {
            user_id: session.user.id,
            ...profile,
            // Ensure required fields have default values
            interests: profile.interests || '',
            study_abroad: profile.study_abroad || '',
            leisure_activities: profile.leisure_activities || '',
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profileData)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        // 跟踪个人资料更新以触发嵌入向量更新
        try {
            await trackProfileUpdate(session.user.id, oldProfile, data);
        } catch (trackingError) {
            // 跟踪失败不应该影响主要功能
            console.error('Error tracking profile update:', trackingError);
        }

        return NextResponse.json({
            success: true,
            profile: data
        });
    } catch (error) {
        console.error('Unexpected error in profile POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}