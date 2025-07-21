import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

// Default settings structure
const defaultSettings = {
    general: {
        notifications: {
            email: true,
            push: true,
            mentions: true,
            comments: true,
            likes: true
        },
        visibility: {
            profile: 'public',
            activity: 'friends',
            email: 'private'
        },
        contentProtection: {
            sensitiveContent: true,
            blurImages: true,
            hideBlockedBoards: false
        },
        blockedCards: [],
        hiddenBoards: []
    },
    preferences: {
        theme: 'system',
        language: 'en',
        fontSize: 'medium',
        reducedMotion: false,
        highContrast: false,
        accessibility: {
            emojiStickers: true
        }
    },
    security: {
        twoFactorAuth: false,
        loginAlerts: true,
        sessionTimeout: 30,
        academicInfo: {
            country: '',
            school: '',
            department: '',
            verified: false,
            pendingVerification: false
        }
    }
};

// GET handler to retrieve user settings
export async function GET(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: settings, error } = await supabase
            .from('user_preferences')
            .select('settings')
            .eq('user_id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        return NextResponse.json({ 
            settings: settings?.settings || defaultSettings 
        });
    } catch (error) {
        console.error('Unexpected error in settings GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST handler to update user settings
export async function POST(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings) {
            return NextResponse.json({ error: 'Settings data is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: session.user.id,
                settings: settings,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Settings saved successfully'
        });
    } catch (error) {
        console.error('Unexpected error in settings POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}