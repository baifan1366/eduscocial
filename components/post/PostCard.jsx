import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function PostCard({ post }) {
  // 格式化日期，如"2小时前"，"3天前"等
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000; // 年
    if (interval > 1) return Math.floor(interval) + " 年前";
    
    interval = seconds / 2592000; // 月
    if (interval > 1) return Math.floor(interval) + " 月前";
    
    interval = seconds / 86400; // 日
    if (interval > 1) return Math.floor(interval) + " 天前";
    
    interval = seconds / 3600; // 小时
    if (interval > 1) return Math.floor(interval) + " 小时前";
    
    interval = seconds / 60; // 分钟
    if (interval > 1) return Math.floor(interval) + " 分钟前";
    
    return Math.floor(seconds) + " 秒前";
  };

  return (
    <Card className="hover:shadow-md transition-shadow bg-white border-0 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 flex items-center">
        <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200 mr-2">
          <img
            src={post.users?.avatar_url || '/images/default-avatar.png'}
            alt={post.users?.username || 'User'}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {post.users?.username || 'Anonymous'}
          </p>
        </div>
        <div className="flex items-center text-xs text-slate-500">
          <span className="mr-2">{post.boards?.name || 'General'}</span>
          <span>•</span>
          <span className="ml-2">{formatTimeAgo(post.created_at)}</span>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/post/${post.id}`} className="block">
          <h3 className="font-bold text-lg mb-2 text-slate-900 hover:text-orange-500 transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-slate-700 line-clamp-3 mb-3 text-sm">
          {post.content?.slice(0, 200)}
          {post.content?.length > 200 ? '...' : ''}
        </p>
      </div>
      
      <div className="flex justify-between text-xs text-slate-500 px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{post.view_count || 0}</span>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>{post.like_count || 0}</span>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>{post.comment_count || 0}</span>
        </div>
      </div>
    </Card>
  );
} 