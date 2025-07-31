import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/qstash';
import { moderatePostText, updateUserInterests, updateUserEmbedding } from '@/lib/moderation';
import { generateEmbedding } from '@/lib/embedding';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * POST handler for text content moderation
 * This endpoint is called asynchronously via QStash
 * 
 * Request body:
 * {
 *   postId: string,     // ID of the post to moderate
 *   content: string,    // Post content
 *   title: string,      // Post title
 *   userId: string      // User who created the post
 * }
 */
export async function POST(request) {
  try {
    // Verify request is from QStash
    const isAuthentic = await verifyQStashSignature(request.clone());
    
    if (!isAuthentic) {
      console.error('Unauthorized request to text moderation endpoint');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { postId, content, title, userId } = await request.json();
    
    if (!postId || !content || !title || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get post hashtags if any
    const supabase = createServerSupabaseClient();
    const { data: postHashtags } = await supabase
      .from('post_hashtags')
      .select('hashtag_id')
      .eq('post_id', postId);
    
    let hashtags = [];
    if (postHashtags && postHashtags.length > 0) {
      const { data: hashtagsData } = await supabase
        .from('hashtags')
        .select('name')
        .in('id', postHashtags.map(ph => ph.hashtag_id));
      
      hashtags = hashtagsData?.map(h => h.name) || [];
    }
    
    // Run tasks in parallel for efficiency
    const [moderationResult, embedding] = await Promise.all([
      // 1. Moderate the text content
      moderatePostText(postId, content, title, userId),
      
      // 2. Generate post embedding
      generateEmbedding(`${title} ${content}`)
    ]);
    
    // If content passes moderation (not flagged)
    if (!moderationResult.isFlagged && embedding) {
      // 3. Save post embedding
      await supabase
        .from('post_embeddings')
        .insert({
          post_id: postId,
          embedding,
          model_version: 'intfloat/e5-small' // Update with your model version
        });
      
      // 4. Update user interests based on post
      await updateUserInterests(userId, postId, hashtags);
      
      // 5. Update user embedding
      await updateUserEmbedding(userId, content, title);
    }
    
    return NextResponse.json({
      success: true,
      moderation: moderationResult,
      embeddingGenerated: !!embedding
    });
    
  } catch (error) {
    console.error('Error in text moderation:', error);
    
    return NextResponse.json(
      { error: 'Text moderation failed', details: error.message },
      { status: 500 }
    );
  }
}


