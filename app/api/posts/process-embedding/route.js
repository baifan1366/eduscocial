import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { generateEmbedding } from '@/lib/embedding';
import { qstashClient } from '@/lib/qstash';

/**
 * Process post embeddings and schedule user embedding updates
 * This endpoint is called when a new post is created or a draft is published
 */
export async function POST(request) {
  try {
    // Verify authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { postId, title, content, updateUserEmbedding = true } = await request.json();
    
    if (!postId || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: postId and content' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    const userId = session.user.id;
    
    // Generate embedding for post content
    console.log(`Generating embedding for post ${postId}`);
    const postEmbedding = await generateEmbedding(`${title || ''} ${content}`);
    
    if (!postEmbedding) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate post embedding' },
        { status: 500 }
      );
    }
    
    // Store post embedding in database
    const { error: embeddingError } = await supabase
      .from('post_embeddings')
      .upsert({
        post_id: postId,
        embedding: postEmbedding,
        model_version: 'intfloat/e5-small', // Update with your model name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'post_id' });
      
    if (embeddingError) {
      console.error('Error storing post embedding:', embeddingError);
      return NextResponse.json(
        { success: false, error: 'Failed to store post embedding' },
        { status: 500 }
      );
    }
    
    // Optionally schedule user embedding update via QStash
    if (updateUserEmbedding && process.env.QSTASH_URL) {
      try {
        // Schedule user embedding update with QStash
        // Using a small delay to ensure post embedding is available
        await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/users/update-embedding`,
          body: {
            user_id: userId,
            title: title || '',
            content
          },
          delay: 60 // Wait 60 seconds before processing
        });
        
        console.log(`Scheduled user embedding update for user ${userId}`);
      } catch (qstashError) {
        console.error('Error scheduling user embedding update:', qstashError);
        // Non-blocking error - continue with post embedding
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Post embedding processed successfully',
      updateUserScheduled: updateUserEmbedding
    });
    
  } catch (error) {
    console.error('Error processing post embedding:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 