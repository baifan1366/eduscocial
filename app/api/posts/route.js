import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import redis from '@/lib/redis/redis';
import { generateEmbedding } from '@/lib/embedding';
import { processPostHashtags } from '@/lib/hashtags';

/**
 * POST handler for creating a new post
 * 
 * Request body should include:
 * - title: string
 * - content: string
 * - board_id: UUID
 * - is_anonymous: boolean (optional, default: false)
 * - post_type: string (optional, default: 'general')
 * - scheduled_publish_at: ISO date string (optional)
 * - hashtags: string[] (optional) - Array of hashtags
 */
export async function POST(request) {
  try {
    // Authenticate the user
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    if (!body.board_id) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerSupabaseClient();
    
    // Determine if post should be draft based on scheduled_publish_at
    const now = new Date();
    const scheduledDate = body.scheduled_publish_at ? new Date(body.scheduled_publish_at) : null;
    const isDraft = scheduledDate && scheduledDate > now;
    
    // Prepare post data
    const postData = {
      title: body.title.trim(),
      content: body.content.trim(),
      author_id: session.user.id,
      board_id: body.board_id,
      is_anonymous: body.is_anonymous || false,
      post_type: body.post_type || 'general',
      is_draft: isDraft,
      scheduled_publish_at: body.scheduled_publish_at || null,
      created_by: session.user.id,
      // Include other fields from body as needed
    };
    
    // Insert post into database
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select('*')
      .single();
    
    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }
    
    // Process hashtags if provided
    if (body.hashtags && Array.isArray(body.hashtags) && body.hashtags.length > 0) {
      try {
        await processPostHashtags(post.id, body.hashtags, session.user.id);
      } catch (hashtagError) {
        console.error('Error processing hashtags:', hashtagError);
        // Continue with post creation even if hashtag processing fails
      }
    }
    
    // Generate and store embedding if post is published immediately
    if (!isDraft) {
      try {
        const embedding = await generateEmbedding(`${post.title} ${post.content}`);
        
        if (embedding) {
          const { error: embeddingError } = await supabase
            .from('post_embeddings')
            .insert({
              post_id: post.id,
              embedding,
              model_version: 'intfloat/e5-small' // Updated model version
            });
          
          if (embeddingError) {
            console.error('Error storing embedding:', embeddingError);
          }
        }
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError);
        // Continue without embedding if there's an error
      }
      
      // Invalidate Redis cache for user feed
      try {
        await redis.del(`user:${session.user.id}:feed`);
        
        // Also invalidate feed caches for followers if needed
        const { data: followers } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', session.user.id);
        
        if (followers && followers.length > 0) {
          const followerIds = followers.map(f => f.follower_id);
          
          // Delete cache for each follower
          await Promise.all(
            followerIds.map(id => redis.del(`user:${id}:feed`))
          );
        }
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
      }
    }
    
    // Return success response with created post
    return NextResponse.json({
      message: isDraft ? 'Post scheduled successfully' : 'Post created successfully',
      post,
      is_scheduled: isDraft
    });
    
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
