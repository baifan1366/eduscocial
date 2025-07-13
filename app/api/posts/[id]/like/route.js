import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { updateUserInterestsFromPost } from '@/lib/recommend/userInterests';

/**
 * POST handler for liking/unliking a post
 * 
 * @param {Request} request - The request object
 * @param {Object} context - The route context containing params
 * @param {Object} context.params - The route parameters
 * @param {string} context.params.id - The post ID
 */
export async function POST(request, { params }) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const postId = params.id;
    const userId = session.user.id;
    const supabase = createServerSupabaseClient();
    
    // Check if user already voted on this post
    const { data: existingVote, error: voteError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .is('comment_id', null)
      .maybeSingle();
    
    if (voteError) {
      console.error('Error checking vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to check vote status' },
        { status: 500 }
      );
    }
    
    let result;
    
    if (existingVote) {
      // User already voted, remove vote (unlike)
      const { data, error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)
        .select();
      
      if (error) {
        console.error('Error removing vote:', error);
        return NextResponse.json(
          { error: 'Failed to unlike post' },
          { status: 500 }
        );
      }
      
      // Decrement like_count in posts table
      await supabase.rpc('decrement_post_like_count', { post_id: postId });
      
      result = { action: 'unliked' };
      
    } else {
      // User hasn't voted, add vote (like)
      const { data, error } = await supabase
        .from('votes')
        .insert([
          {
            user_id: userId,
            post_id: postId,
            vote_type: 'like',
            created_by: userId
          }
        ])
        .select();
      
      if (error) {
        console.error('Error adding vote:', error);
        return NextResponse.json(
          { error: 'Failed to like post' },
          { status: 500 }
        );
      }
      
      // Increment like_count in posts table
      await supabase.rpc('increment_post_like_count', { post_id: postId });
      
      result = { action: 'liked' };
      
      // Update user interests (async)
      updateUserInterestsFromPost(userId, postId, 'like')
        .catch(err => console.error('Error updating user interests:', err));
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error processing like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
