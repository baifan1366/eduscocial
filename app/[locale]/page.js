import { getHomePagePosts } from '@/lib/recommend/coldStart';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PostsList from '@/components/home/PostsList';
import Sidebar from '@/components/home/Sidebar';
import NewUserInterestCheck from '@/components/home/NewUserInterestCheck';

export default async function HomePage({ searchParams }) {
  // Get current session from server side
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id || null;
  
  // Fetch posts with server component
  const posts = await getHomePagePosts(userId, 20);
  
  // Note: This will be rendered once when the page loads
  // Any client-side updates will be handled by client components
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to EduSocial</h1>
        <p className="text-gray-600">Connect with your school community</p>
      </div>
      
      {/* Content section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <Sidebar isAuthenticated={isAuthenticated} />
        
        {/* Main content */}
        <div className="md:col-span-2">
          <PostsList posts={posts} loading={false} />
        </div>
      </div>
      
      {/* New user check component (client component) */}
      <NewUserInterestCheck />
    </div>
  );
}
