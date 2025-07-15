import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { supabase } from '@/lib/supabase';
import { authOptions } from '@/lib/auth';

// GET handler to retrieve user settings
export async function GET(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Query the user preferences table
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
    
    // If no settings found, return default settings
    if (!data) {
      return NextResponse.json({
        settings: getDefaultSettings()
      });
    }
    
    return NextResponse.json({
      settings: data.settings || getDefaultSettings()
    });
  } catch (error) {
    console.error('Unexpected error in settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to update user settings
export async function POST(request) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { settings } = body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }
    
    // Check if user already has settings
    const { data: existingSettings } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    let result;
    
    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from('user_preferences')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);
    } else {
      // Insert new settings
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: session.user.id,
          settings,
          created_by: session.user.id
        });
    }
    
    if (result.error) {
      console.error('Error saving user settings:', result.error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
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

// Default settings for new users
function getDefaultSettings() {
  return {
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
      theme: 'system', // system, light, dark
      language: 'en',
      fontSize: 'medium', // small, medium, large
      reducedMotion: false,
      highContrast: false,
      accessibility: {
        emojiStickers: true // Show suggested stickers based on emoji input
      }
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30, // days
      academicInfo: {
        country: '',
        school: '',
        department: '',
        verified: false,
        pendingVerification: false
      }
    }
  };
} 