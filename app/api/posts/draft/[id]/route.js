import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/serverAuth';
import { supabase } from '@/lib/supabase';

// GET /api/posts/draft/[id] - Get a specific draft by ID
export async function GET(request, { params }) {
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

    const draftId = params.id;

    // Fetch the draft
    const { data: draft, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', draftId)
      .eq('is_draft', true)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch draft',
        details: error.message
      }, { 
        status: 500
      });
    }

    // If no draft found
    if (!draft) {
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { 
        status: 404
      });
    }

    // Ensure the user owns this draft
    if (draft.author_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You do not have permission to access this draft' 
      }, { 
        status: 403
      });
    }

    return NextResponse.json({
      success: true,
      data: draft,
      message: 'Draft retrieved successfully'
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

// DELETE /api/posts/draft/[id] - Delete a specific draft
export async function DELETE(request, { params }) {
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

    const draftId = params.id;

    // First, check if the draft exists and belongs to the user
    const { data: draft, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', draftId)
      .eq('is_draft', true)
      .maybeSingle();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch draft',
        details: fetchError.message
      }, { 
        status: 500
      });
    }

    // If no draft found
    if (!draft) {
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { 
        status: 404
      });
    }

    // Ensure the user owns this draft
    if (draft.author_id !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You do not have permission to delete this draft' 
      }, { 
        status: 403
      });
    }

    // Delete the draft
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', draftId)
      .eq('is_draft', true);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete draft',
        details: deleteError.message
      }, { 
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
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