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
    const type = searchParams.get('type') || 'general';

    // Fetch the user's most recent draft of the specified type
    const { data: draft, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', session.user.id)
      .eq('status', 'pending')
      .eq('is_draft', true)
      .eq('post_type', type)
      .order('updated_at', { ascending: false })
      .limit(1)
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
        success: true,
        data: null,
        message: 'No draft found' 
      }, { 
        status: 200
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

export async function POST(request) {
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

    const body = await request.json();
    const { title, content, type = 'general', template = null } = body;

    // For drafts, we allow empty title and content
    const draftData = {
      title: title?.trim() || '',
      content: content?.trim() || '',
      post_type: type,
      template,
      author_id: session.user.id,
      status: 'pending',
      is_draft: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if there's an existing draft for this user
    const { data: existingDraft, error: queryError } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', session.user.id)
      .eq('status', 'pending')
      .eq('is_draft', true)
      .eq('post_type', type)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json({ 
        error: 'Failed to check for existing drafts',
        details: queryError.message
      }, { 
        status: 500
      });
    }

    let result;
    if (existingDraft) {
      // Update existing draft
      const { data: updatedDraft, error } = await supabase
        .from('posts')
        .update({
          title: draftData.title,
          content: draftData.content,
          template: draftData.template,
          updated_at: draftData.updated_at
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
          error: 'Failed to update draft',
          details: error.message
        }, { 
          status: 500
        });
      }

      result = updatedDraft;
    } else {
      // Create new draft
      const { data: newDraft, error } = await supabase
        .from('posts')
        .insert(draftData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
          error: 'Failed to save draft',
          details: error.message
        }, { 
          status: 500
        });
      }

      result = newDraft;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Draft saved successfully'
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