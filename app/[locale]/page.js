import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PostsList from '@/components/home/PostsList';
import Sidebar from '@/components/home/Sidebar';
import NewUserInterestCheck from '@/components/home/NewUserInterestCheck';

// 获取主页帖子的服务器端函数
async function getHomePagePostsFromAPI(userId, limit = 20) {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/recommend/home?limit=${limit}`;
  
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Cookie': `next-auth.session-token=${userId ? 'exists' : 'none'}` // 只是一个标记，实际认证由getSession处理
      },
      cache: 'no-cache' // 每次请求都获取最新数据
    });
    
    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching home posts from API:', error);
    return []; // 发生错误时返回空数组
  }
}

export default async function HomePage({ searchParams }) {
  // 从服务器端获取当前会话
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id || null;
  
  // 通过API获取帖子
  const posts = await getHomePagePostsFromAPI(userId, 20);
  
  // 注意：这将在页面加载时渲染一次
  // 任何客户端更新将由客户端组件处理
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页头部分 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to EduSocial</h1>
        <p className="text-gray-600">Connect with your school community</p>
      </div>
      
      {/* 内容部分 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 侧边栏 */}
        <Sidebar isAuthenticated={isAuthenticated} />
        
        {/* 主要内容 */}
        <div className="md:col-span-2">
          <PostsList posts={posts} loading={false} />
        </div>
      </div>
      
      {/* 新用户检查组件（客户端组件） */}
      <NewUserInterestCheck />
    </div>
  );
}
