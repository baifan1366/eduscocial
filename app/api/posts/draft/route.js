import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, type = 'article', template = null } = body;

    // For drafts, we allow empty title and content
    const draftData = {
      title: title?.trim() || '',
      content: content?.trim() || '',
      type,
      template,
      author_id: session.user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if there's an existing draft for this user
    const { data: existingDraft } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', session.user.id)
      .eq('status', 'draft')
      .eq('type', type)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

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
        return NextResponse.json(
          { error: 'Failed to update draft' },
          { status: 500 }
        );
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
        return NextResponse.json(
          { error: 'Failed to save draft' },
          { status: 500 }
        );
      }

      result = newDraft;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Draft saved successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}