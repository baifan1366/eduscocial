import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        console.log('Testing supabase connection...');
        
        // Test basic connection by trying to select from a simple table
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Supabase connection error:', error);
            return NextResponse.json({ 
                error: 'Database connection failed',
                details: error.message 
            }, { status: 500 });
        }

        console.log('Supabase connection successful');
        return NextResponse.json({ 
            success: true, 
            message: 'Database connection working',
            hasUsers: data && data.length > 0
        });
    } catch (error) {
        console.error('Test API error:', error);
        return NextResponse.json({ 
            error: 'Test failed',
            details: error.message 
        }, { status: 500 });
    }
}