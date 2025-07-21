import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getServerSession } from '@/lib/auth/serverAuth';
import { storeUserInterests } from '@/lib/redis/redisUtils';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const { selectedTopics = [], selectedTags = [] } = await request.json();
    
    const supabase = createServerSupabaseClient();
    
    // 处理主题分类
    for (const topicId of selectedTopics) {
      await supabase.from('user_interests').upsert({
        user_id: userId,
        topic_id: topicId,
        weight: 1.0,
        created_by: userId
      });
    }
    
    // 处理标签
    for (const tagId of selectedTags) {
      await supabase.from('user_interests').upsert({
        user_id: userId,
        tag_id: tagId,
        weight: 1.0,
        created_by: userId
      });
    }
    
    // 保存到Redis以便快速访问
    const interests = {
      topics: selectedTopics,
      tags: selectedTags
    };
    
    await storeUserInterests(userId, interests);
    
    return NextResponse.json({ 
      success: true,
      message: '用户兴趣已保存'
    });
    
  } catch (error) {
    console.error('Error saving user interests:', error);
    return NextResponse.json(
      { error: '保存用户兴趣失败' },
      { status: 500 }
    );
  }
} 