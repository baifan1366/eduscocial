import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        console.log('=== DEBUG API START ===');
        
        // Check environment variables
        const hasSupabaseUrl = !!process.env.SUPABASE_URL;
        const hasSupabaseKey = !!process.env.SUPABASE_ANON_KEY;
        
        console.log('Environment check:', { hasSupabaseUrl, hasSupabaseKey });
        
        // Check session
        let sessionInfo = null;
        try {
            const session = await getServerSession(authOptions);
            sessionInfo = {
                hasSession: !!session,
                hasUser: !!session?.user,
                userId: session?.user?.id || null
            };
            console.log('Session check:', sessionInfo);
        } catch (sessionError) {
            console.error('Session error:', sessionError);
            sessionInfo = { error: sessionError.message };
        }
        
        // Test basic supabase connection
        let connectionTest = null;
        try {
            const { data, error } = await supabase
                .from('users')
                .select('count')
                .limit(1);
                
            connectionTest = {
                success: !error,
                error: error?.message || null,
                hasData: !!data
            };
            console.log('Connection test:', connectionTest);
        } catch (connError) {
            console.error('Connection error:', connError);
            connectionTest = { error: connError.message };
        }
        
        // Test boards table
        let boardsTest = null;
        try {
            const { data, error } = await supabase
                .from('boards')
                .select('count')
                .limit(1);
                
            boardsTest = {
                success: !error,
                error: error?.message || null,
                hasData: !!data
            };
            console.log('Boards test:', boardsTest);
        } catch (boardsError) {
            console.error('Boards error:', boardsError);
            boardsTest = { error: boardsError.message };
        }
        
        // Test user_profiles table
        let profilesTest = null;
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('count')
                .limit(1);
                
            profilesTest = {
                success: !error,
                error: error?.message || null,
                hasData: !!data
            };
            console.log('Profiles test:', profilesTest);
        } catch (profilesError) {
            console.error('Profiles error:', profilesError);
            profilesTest = { error: profilesError.message };
        }
        
        console.log('=== DEBUG API END ===');
        
        return NextResponse.json({
            environment: { hasSupabaseUrl, hasSupabaseKey },
            session: sessionInfo,
            connection: connectionTest,
            boards: boardsTest,
            profiles: profilesTest,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Debug API error:', error);
        return NextResponse.json({ 
            error: 'Debug failed',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}