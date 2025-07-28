import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyJWT, isTokenValid } from '@/lib/auth/jwt';
import { 
  getHotPosts, 
  getUserInterests,
  getPersonalizedRecommendations,
  cachePersonalizedRecommendations,
  isNewUser
} from '@/lib/redis/redisUtils';

// 将计算帖子评分的函数直接实现在路由文件中
function calculatePostScore(post, userInterests) {
  let score = 0;
  
  // 基于流行度的基础分
  score += (post.view_count || 0) * 0.01; // 每100次浏览加1分
  score += (post.like_count || 0) * 0.5;  // 每个赞加0.5分
  score += (post.comment_count || 0) * 0.3; // 每条评论加0.3分
  
  // 最近帖子的提升 - 24小时内的帖子获得提升
  const now = new Date();
  const postDate = new Date(post.created_at);
  const hoursSincePosted = (now - postDate) / (1000 * 60 * 60);
  
  if (hoursSincePosted < 24) {
    score += 10 * (1 - hoursSincePosted / 24); // 线性衰减，从10加分开始
  }
  
  // 如果有用户兴趣可以考虑
  if (userInterests) {
    // 话题匹配
    if (userInterests.topics && userInterests.topics.length > 0) {
      // 这是一个简化版本 - 在实际实现中，你需要一个合适的方式来将帖子链接到话题
      if (post.topic_id && userInterests.topics.includes(post.topic_id)) {
        score += 15; // 话题匹配大幅提升
      }
    }
    
    // 标签匹配
    if (userInterests.tags && userInterests.tags.length > 0 && post.hashtags) {
      // 假设post.hashtags是标签ID数组
      // 在实际实现中，你可能需要与post_hashtags表连接
      const matchingTags = post.hashtags.filter(tagId => 
        userInterests.tags.includes(tagId)
      );
      
      score += matchingTags.length * 5; // 每个匹配标签加5分
    }
  }
  
  return score;
}

// 从cookies获取用户ID的辅助函数
async function getUserIdFromCookies() {
  const authToken = (await cookies()).get('auth_token')?.value;
  
  if (!authToken) {
    return null;
  }
  
  try {
    const decoded = await verifyJWT(authToken);
    if (isTokenValid(decoded)) {
      return decoded.id;
    }
  } catch (error) {
    console.error('Error verifying JWT token:', error);
  }
  
  return null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // 使用自定义认证系统获取用户ID
    const userId = await getUserIdFromCookies();
    
    // 如果用户未登录，返回热门帖子
    if (!userId) {
      const response = await fetch(new URL('/api/recommend/trending', request.url).toString());
      return response;
    }
    
    // 检查用户是否有缓存的推荐
    const cachedRecommendations = await getPersonalizedRecommendations(userId);
    
    if (cachedRecommendations && cachedRecommendations.length >= limit) {
      return NextResponse.json({
        posts: cachedRecommendations.slice(0, limit),
        personalized: true,
        cached: true
      });
    }
    
    // 检查用户是否是新用户
    const userIsNew = await isNewUser(userId);
    
    if (userIsNew) {
      // 对于新用户，返回热门帖子
      const response = await fetch(new URL('/api/recommend/trending', request.url).toString());
      const data = await response.json();
      
      return NextResponse.json({
        posts: data.posts,
        personalized: false,
        isNewUser: true
      });
    }
    
    // 获取用户兴趣
    const interests = await getUserInterests(userId);
    
    if (!interests || (!interests.topics?.length && !interests.tags?.length)) {
      // 如果没有找到兴趣，返回热门帖子
      const response = await fetch(new URL('/api/recommend/trending', request.url).toString());
      const data = await response.json();
      
      return NextResponse.json({
        posts: data.posts,
        personalized: false
      });
    }
    
    // 获取与用户兴趣相关的帖子
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        slug,
        created_at,
        author_id,
        is_anonymous,
        author:users!posts_author_id_fkey(username, avatar_url),
        board_id,
        board:boards(name, slug),
        view_count,
        like_count,
        comment_count
      `)
      .eq('is_draft', false)
      .eq('is_deleted', false);
    
    // 获取与用户话题兴趣相关的帖子
    if (interests.topics && interests.topics.length > 0) {
      // 这需要自定义SQL来与话题表连接
      // 简化版本 - 可以通过在数据库中创建视图或函数来改进
    }
    
    // 获取与用户标签兴趣相关的帖子
    if (interests.tags && interests.tags.length > 0) {
      query = query.or(
        interests.tags.map(tagId => `post_hashtags.hashtag_id.eq.${tagId}`).join(',')
      ).join('post_hashtags', { 'posts.id': 'post_hashtags.post_id' });
    }
    
    // 获取数据
    const { data: posts, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit * 2); // 获取比所需更多的帖子用于评分
    
    if (error) {
      console.error('Error fetching personalized posts:', error);
      
      // 失败时回退到热门帖子
      const response = await fetch(new URL('/api/recommend/trending', request.url).toString());
      const data = await response.json();
      
      return NextResponse.json({
        posts: data.posts,
        personalized: false,
        fallback: true
      });
    }
    
    // 基于用户兴趣对帖子进行评分和排名
    const scoredPosts = posts.map(post => ({
      ...post,
      score: calculatePostScore(post, interests)
    }));
    
    // 按评分排序
    scoredPosts.sort((a, b) => b.score - a.score);
    
    // 选取评分最高的帖子
    const topPosts = scoredPosts.slice(0, limit);
    
    // 缓存个性化推荐
    await cachePersonalizedRecommendations(userId, topPosts);
    
    return NextResponse.json({
      posts: topPosts,
      personalized: true,
      cached: false
    });
    
  } catch (error) {
    console.error('Error in home posts API:', error);
    
    // 发生错误时，尝试回退到热门帖子
    try {
      const response = await fetch(new URL('/api/recommend/trending', request.url).toString());
      return response;
    } catch (fallbackError) {
      return NextResponse.json(
        { error: '获取帖子失败' },
        { status: 500 }
      );
    }
  }
} 