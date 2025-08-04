import { getTranslations } from 'next-intl/server';
import PostCard from '@/components/home/PostCard';

// Mock data for testing
const mockPost = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Welcome to the new Facebook-style interface! 🎉',
  content: `This is a test post to showcase our new Facebook-inspired layout. 

Key improvements include:
• Clean stats bar showing likes, comments, views, shares, and reactions
• Full-width action buttons for better usability
• Integrated reactions system with emoji support in the stats bar
• Preserved dark theme with beautiful gradients
• Enhanced hover effects and animations

The interface now feels more familiar while maintaining our unique visual identity!`,
  author: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    username: 'demo_user',
    avatar_url: null
  },
  board: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'General Discussion',
    slug: 'general'
  },
  is_anonymous: false,
  created_at: new Date().toISOString(),
  like_count: 42,
  comments_count: 15,
  view_count: 128,
  share_count: 8,
  reaction_counts: {
    '👍': 25,
    '❤️': 12,
    '😂': 8,
    '😮': 3,
    '😢': 1,
    '😡': 1
  },
  hotComments: [
    {
      id: '123e4567-e89b-12d3-a456-426614174003',
      content: 'This new layout looks amazing! Much more intuitive than before.',
      author: {
        id: '123e4567-e89b-12d3-a456-426614174004',
        username: 'happy_user'
      },
      is_anonymous: false,
      like_count: 8,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '123e4567-e89b-12d3-a456-426614174005',
      content: 'Love the reactions feature! 👍❤️😂',
      author: {
        id: '123e4567-e89b-12d3-a456-426614174006',
        username: 'emoji_lover'
      },
      is_anonymous: false,
      like_count: 12,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]
};

export default async function TestFacebookStylePage() {
  const t = await getTranslations('TestPage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#132F4C] to-[#1E3A5F]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Facebook-Style Interface Test
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience our new Facebook-inspired layout with enhanced usability, 
            beautiful reactions, and preserved dark theme aesthetics.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-white font-semibold mb-2">Complete Stats Bar</h3>
            <p className="text-gray-400 text-sm">
              Single line showing likes, comments, views, shares, and reactions
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Action Buttons</h3>
            <p className="text-gray-400 text-sm">
              Full-width Like, Comment, Share buttons for better accessibility
            </p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="text-2xl mb-3">😊</div>
            <h3 className="text-white font-semibold mb-2">Integrated Reactions</h3>
            <p className="text-gray-400 text-sm">
              Reactions are now integrated into the stats bar for a cleaner, single-line layout
            </p>
          </div>
        </div>

        {/* Test Post */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-4 text-center">
            📱 Live Demo
          </h2>
          <PostCard post={mockPost} />
        </div>

        {/* Instructions */}
        <div className="mt-8 max-w-2xl mx-auto bg-blue-500/10 border border-blue-400/30 rounded-2xl p-6">
          <h3 className="text-blue-300 font-semibold mb-3 flex items-center">
            <span className="mr-2">💡</span>
            How to Test
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• <strong>Hover</strong> over the post card to see gradient animations</li>
            <li>• <strong>Click</strong> the Like button to see the interaction feedback</li>
            <li>• <strong>Try</strong> the Comment button to expand the comment section</li>
            <li>• <strong>Notice</strong> the complete stats bar: ❤️1 💬1 👁️4 🔗0 + reactions</li>
            <li>• <strong>Observe</strong> all statistics are in one clean line (no duplication)</li>
          </ul>
        </div>

        {/* Database Setup Notice */}
        <div className="mt-6 max-w-2xl mx-auto bg-yellow-500/10 border border-yellow-400/30 rounded-2xl p-6">
          <h3 className="text-yellow-300 font-semibold mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Database Setup Required
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            To enable full reactions functionality, run the migration script:
          </p>
          <code className="block bg-black/30 text-green-300 p-3 rounded-lg text-xs">
            -- Run in Supabase SQL Editor<br/>
            -- File: db/migrations/add_reactions_and_update_schema.sql
          </code>
        </div>
      </div>
    </div>
  );
}
