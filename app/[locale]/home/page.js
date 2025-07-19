import { cookies } from 'next/headers';
import { verifyJWT, isTokenValid } from '@/lib/auth/jwt';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// 获取主页帖子的服务器端函数
async function getHomePagePostsFromAPI(userId, limit = 20) {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/recommend/home?limit=${limit}`;
  
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': userId ? `Bearer ${userId}` : '' // 使用用户ID作为授权标识
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

// 用于显示帖子列表的简单组件
function PostsListServer({ posts = [] }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-white">No posts yet</h3>
        <p className="text-gray-400">Follow topics or users to see posts here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-[#1E4976] rounded-full"></div>
            <div className="ml-3">
              <p className="font-medium text-white">{post.author?.username || 'Anonymous'}</p>
              <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">{post.title}</h3>
          <p className="text-gray-300 mb-4">{post.content?.substring(0, 200)}...</p>
          <div className="flex items-center text-gray-400 text-sm">
            <span className="mr-4">{post.likes_count || 0} likes</span>
            <span>{post.comments_count || 0} comments</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// 侧边栏组件
function SidebarServer({ isAuthenticated }) {
  return (
    <div className="space-y-4">
      {isAuthenticated ? (
        <>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Topics</h3>
            <ul className="space-y-1">
              <li><Link href="/my/topics" className="text-[#FF7D00] hover:underline">View all topics</Link></li>
            </ul>
          </div>
          <div className="bg-[#132F4C] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-white">My Cards</h3>
            <Link href="/my/cards" className="text-[#FF7D00] hover:underline">Create new card</Link>
          </div>
        </>
      ) : (
        <div className="bg-[#132F4C] rounded-lg p-4">
          <h3 className="font-bold text-lg mb-2 text-white">Join EduSocial</h3>
          <p className="mb-4 text-gray-300">Sign in to see personalized content and connect with your school community</p>
          <div className="space-x-2">
            <Link href="/login" className="bg-[#FF7D00] text-white px-4 py-2 rounded-md hover:bg-[#FF7D00]/90 transition-colors">
              Login
            </Link>
            <Link href="/register" className="border border-[#FF7D00] text-[#FF7D00] px-4 py-2 rounded-md hover:bg-[#FF7D00]/10 transition-colors">
              Register
            </Link>
          </div>
        </div>
      )}
      <div className="bg-[#132F4C] rounded-lg p-4">
        <h3 className="font-bold text-lg mb-2 text-white">Trending Topics</h3>
        <ul className="space-y-1 text-gray-300">
          <li><Link href="/topic/academic" className="hover:text-[#FF7D00]">Academic</Link></li>
          <li><Link href="/topic/campus-life" className="hover:text-[#FF7D00]">Campus Life</Link></li>
          <li><Link href="/topic/career" className="hover:text-[#FF7D00]">Career</Link></li>
        </ul>
      </div>
    </div>
  );
}

export default async function HomePage({ searchParams }) {
  const t = await getTranslations('HomePage');
  
  // 使用自定义认证检查用户会话
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  let userId = null;
  let isAuthenticated = false;
  
  if (authToken) {
    try {
      const decoded = await verifyJWT(authToken);
      if (isTokenValid(decoded)) {
        isAuthenticated = true;
        userId = decoded.id;
      }
    } catch (error) {
      console.error('Error verifying JWT token:', error);
    }
  }
  
  // 通过API获取帖子
  const posts = await getHomePagePostsFromAPI(userId, 20);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页头部分 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-white">{t('welcome')}</h1>
        <p className="text-gray-400">{t('connectWithCommunity')}</p>
      </div>
      
      {/* 内容部分 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 侧边栏 */}
        <SidebarServer isAuthenticated={isAuthenticated} />
        
        {/* 主要内容 */}
        <div className="md:col-span-2">
          <PostsListServer posts={posts} />
        </div>
      </div>
    </div>
  );
}
