import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    // Use getServerSession for authentication
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: Valid authentication required'
      }, { 
        status: 401
      });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Build query
    let query = supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .eq('status', 'pending')
      .eq('is_draft', true)
      .order('updated_at', { ascending: false });
    
    // Add type filter if specified
    if (type && type !== 'all') {
      query = query.eq('post_type', type);
    }

    // Execute query
    const { data: drafts, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch drafts',
        details: error.message
      }, { 
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      drafts,
      message: 'Drafts retrieved successfully'
    }, { 
      status: 200
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { 
      status: 500
    });
  }
} 