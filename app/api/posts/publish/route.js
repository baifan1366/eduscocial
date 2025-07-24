import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import redis from '@/lib/redis/redis';
import { generateEmbedding } from '@/lib/embedding';
import { verifyQStashSignature } from '@/lib/qstash';

/**
 * POST handler for publishing scheduled posts
 * This endpoint is triggered by Upstash QStash scheduler
 * 
 * Security: Verify QStash signature in production
 */
export async function POST(request) {
  try {
    // Verify request is from QStash in production
    const isAuthentic = await verifyQStashSignature(request.clone());
    
    if (!isAuthentic) {
      console.error('Unauthorized request to publish endpoint');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get current time
    const now = new Date().toISOString();
    
    // Query for draft posts scheduled for publishing
    const { data: scheduledPosts, error: queryError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_draft', true)
      .lte('scheduled_publish_at', now)
      .order('scheduled_publish_at', { ascending: true });
    
    if (queryError) {
      console.error('Error querying scheduled posts:', queryError);
      return NextResponse.json(
        { error: 'Failed to query scheduled posts' },
        { status: 500 }
      );
    }
    
    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts scheduled for publishing at this time',
        published: 0
      });
    }
    
    // Track affected user IDs for cache invalidation
    const affectedUserIds = new Set();
    const publishResults = [];
    
    // Process each scheduled post
    for (const post of scheduledPosts) {
      try {
        // Update post to published state
        const { data: updatedPost, error: updateError } = await supabase
          .from('posts')
          .update({ is_draft: false })
          .eq('id', post.id)
          .select('*')
          .single();
        
        if (updateError) {
          console.error(`Error publishing post ${post.id}:`, updateError);
          publishResults.push({
            post_id: post.id,
            success: false,
            error: updateError.message
          });
          continue;
        }
        
        // Generate embedding if missing
        const { data: existingEmbedding, error: embeddingCheckError } = await supabase
          .from('post_embeddings')
          .select('id')
          .eq('post_id', post.id)
          .maybeSingle();
        
        if (embeddingCheckError) {
          console.error(`Error checking embedding for post ${post.id}:`, embeddingCheckError);
        }
        
        if (!existingEmbedding) {
          try {
            const embedding = await generateEmbedding(`${post.title} ${post.content}`);
            
            if (embedding) {
              const { error: insertError } = await supabase
                .from('post_embeddings')
                .insert({
                  post_id: post.id,
                  embedding,
                  model_version: 'v1'
                });
              
              if (insertError) {
                console.error(`Error storing embedding for post ${post.id}:`, insertError);
              }
            }
          } catch (embeddingError) {
            console.error(`Error generating embedding for post ${post.id}:`, embeddingError);
            // Continue without embedding
          }
        }
        
        // Track the post author for cache invalidation
        affectedUserIds.add(post.author_id);
        
        publishResults.push({
          post_id: post.id,
          success: true
        });
        
      } catch (postError) {
        console.error(`Error processing post ${post.id}:`, postError);
        publishResults.push({
          post_id: post.id,
          success: false,
          error: 'Internal processing error'
        });
      }
    }
    
    // Invalidate Redis cache for affected users
    if (affectedUserIds.size > 0) {
      try {
        // Get followers of affected users
        const { data: followers, error: followersError } = await supabase
          .from('followers')
          .select('follower_id, following_id')
          .in('following_id', Array.from(affectedUserIds));
        
        if (followersError) {
          console.error('Error fetching followers:', followersError);
        } else if (followers && followers.length > 0) {
          // Add followers to affected users
          followers.forEach(f => affectedUserIds.add(f.follower_id));
        }
        
        // Invalidate caches in parallel
        await Promise.all(
          Array.from(affectedUserIds).map(userId => 
            redis.del(`user:${userId}:feed`)
          )
        );
      } catch (cacheError) {
        console.error('Error invalidating cache:', cacheError);
      }
    }
    
    // Return summary of published posts
    return NextResponse.json({
      message: `Published ${publishResults.filter(r => r.success).length} scheduled posts`,
      total_processed: scheduledPosts.length,
      successful: publishResults.filter(r => r.success).length,
      failed: publishResults.filter(r => !r.success).length,
      results: publishResults
    });
    
  } catch (error) {
    console.error('Error in scheduled publishing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 