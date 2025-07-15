import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function PostCard({ post }) {
  return (
    <Card className="p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-3">
        <div className="h-8 w-8 mr-2 rounded-full overflow-hidden">
          <img
            src={post.users?.avatar_url || '/images/default-avatar.png'}
            alt={post.users?.display_name || post.users?.username || 'User'}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium">
            {post.users?.display_name || post.users?.username || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-500">
            in {post.boards?.name || 'General'} • {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <Link href={`/post/${post.id}`}>
        <h3 className="font-bold text-lg mb-2 hover:text-primary">{post.title}</h3>
      </Link>
      
      <p className="text-gray-700 line-clamp-3 mb-3">
        {post.content?.slice(0, 200)}
        {post.content?.length > 200 ? '...' : ''}
      </p>
      
      <div className="flex justify-between text-sm text-gray-500">
        <span>{post.view_count || 0} views</span>
        <span>{post.like_count || 0} likes</span>
        <span>{post.comment_count || 0} comments</span>
      </div>
    </Card>
  );
} 