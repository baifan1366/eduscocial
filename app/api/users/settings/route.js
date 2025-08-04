import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

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

        try {
            // Fetch user settings from database using existing user_preferences table
            const { data: userPreferences, error } = await supabase
                .from('user_preferences')
                .select('settings')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching user preferences:', error);
                return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
            }

            // If no settings found, return default settings
            if (!userPreferences || !userPreferences.settings) {
                return NextResponse.json({ settings: defaultSettings });
            }

            // Merge user settings with defaults to ensure all properties exist
            const userSettings = userPreferences.settings;
            const mergedSettings = {
                general: { ...defaultSettings.general, ...(userSettings.general || {}) },
                preferences: { ...defaultSettings.preferences, ...(userSettings.preferences || {}) },
                security: { ...defaultSettings.security, ...(userSettings.security || {}) }
            };

            return NextResponse.json({ settings: mergedSettings });

        } catch (dbError) {
            console.error('Database error in settings GET:', dbError);
            // Fall back to default settings on database error
            return NextResponse.json({ settings: defaultSettings });
        }

    } catch (error) {
        console.error('Unexpected error in settings GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH handler to update user settings
export async function PATCH(request) {
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

        // Use existing user_preferences table to store settings
        try {
            // Check if user preferences already exist
            const { data: existingPreferences, error: fetchError } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching existing preferences:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch existing preferences' }, { status: 500 });
            }

            // Prepare update data - only update settings and updated_at
            // Theme is now handled by a separate API endpoint
            const updateData = {
                settings: settings,
                updated_at: new Date().toISOString()
            };

            let result;
            if (existingPreferences) {
                // Update existing preferences
                const { data, error } = await supabase
                    .from('user_preferences')
                    .update(updateData)
                    .eq('user_id', session.user.id)
                    .select()
                    .single();

                if (error) {
                    console.error('Error updating preferences:', error);
                    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
                }
                result = data;
            } else {
                // Create new preferences record
                const insertData = {
                    user_id: session.user.id,
                    settings: settings,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Theme is handled by separate API endpoint, don't include it here

                const { data, error } = await supabase
                    .from('user_preferences')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) {
                    console.error('Error creating preferences:', error);
                    return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
                }
                result = data;
            }

            return NextResponse.json({
                success: true,
                message: 'Settings saved successfully',
                settings: result.settings
            });

        } catch (dbError) {
            console.error('Database error in settings update:', dbError);
            return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
        }

    } catch (error) {
        console.error('Unexpected error in settings PATCH:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}