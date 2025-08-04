import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';

// GET handler to retrieve user theme
export async function GET(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            // Fetch user theme from database
            const { data: userPreferences, error } = await supabase
                .from('user_preferences')
                .select('theme')
                .eq('user_id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching user theme:', error);
                return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
            }

            // If no preferences found, return default theme
            const theme = userPreferences?.theme || 'system';
            
            return NextResponse.json({ theme });

        } catch (dbError) {
            console.error('Database error in theme GET:', dbError);
            // Fall back to default theme on database error
            return NextResponse.json({ theme: 'system' });
        }

    } catch (error) {
        console.error('Unexpected error in theme GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH handler to update user theme
export async function PATCH(request) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { theme } = body;

        if (!theme) {
            return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
        }

        // Validate theme value
        const validThemes = ['light', 'dark', 'system'];
        if (!validThemes.includes(theme)) {
            return NextResponse.json({ error: 'Invalid theme value' }, { status: 400 });
        }

        try {
            // Check if user preferences already exist
            const { data: existingPreferences, error: fetchError } = await supabase
                .from('user_preferences')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error fetching existing preferences:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch existing preferences' }, { status: 500 });
            }

            let result;
            if (existingPreferences) {
                // Update existing preferences - only update theme column
                const { data, error } = await supabase
                    .from('user_preferences')
                    .update({ 
                        theme: theme,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', session.user.id)
                    .select('theme')
                    .single();

                if (error) {
                    console.error('Error updating theme:', error);
                    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
                }
                result = data;
            } else {
                // Create new preferences record with only theme
                const { data, error } = await supabase
                    .from('user_preferences')
                    .insert({
                        user_id: session.user.id,
                        theme: theme,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select('theme')
                    .single();

                if (error) {
                    console.error('Error creating theme preference:', error);
                    return NextResponse.json({ error: 'Failed to create theme preference' }, { status: 500 });
                }
                result = data;
            }

            return NextResponse.json({
                success: true,
                message: 'Theme updated successfully',
                theme: result.theme
            });

        } catch (dbError) {
            console.error('Database error in theme update:', dbError);
            return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
        }

    } catch (error) {
        console.error('Unexpected error in theme PATCH:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
