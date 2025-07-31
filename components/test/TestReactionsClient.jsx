'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactionButton from '@/components/reactions/ReactionButton';
import ReactionPicker from '@/components/reactions/ReactionPicker';

export default function TestReactionsClient() {
  const t = useTranslations('Reactions');
  const [reactionCounts, setReactionCounts] = useState({
    '👍': 5,
    '❤️': 3,
    '😂': 2,
    '😮': 1
  });
  const [userReactions, setUserReactions] = useState(['👍']);

  const handleReaction = (emoji, action) => {
    console.log('Reaction:', emoji, action);
    
    if (action === 'add') {
      setReactionCounts(prev => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1
      }));
      setUserReactions(prev => [...prev.filter(r => r !== emoji), emoji]);
    } else {
      setReactionCounts(prev => ({
        ...prev,
        [emoji]: Math.max((prev[emoji] || 0) - 1, 0)
      }));
      setUserReactions(prev => prev.filter(r => r !== emoji));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test Reactions Component</h1>
      
      <div className="space-y-8">
        {/* Test Post Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Post</h2>
          <p className="text-gray-600 mb-6">
            This is a sample post to test the reactions functionality. 
            You can click on the reaction buttons below to see how they work.
          </p>
          
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Display existing reactions */}
              {Object.entries(reactionCounts)
                .filter(([_, count]) => count > 0)
                .map(([emoji, count]) => (
                  <ReactionButton
                    key={emoji}
                    emoji={emoji}
                    count={count}
                    isActive={userReactions.includes(emoji)}
                    onClick={handleReaction}
                  />
                ))}
              
              {/* Reaction picker */}
              <ReactionPicker
                onEmojiSelect={handleReaction}
              />
            </div>
          </div>
        </Card>

        {/* Test Comment */}
        <Card className="p-6 ml-8">
          <h3 className="text-lg font-semibold mb-2">Sample Comment</h3>
          <p className="text-gray-600 mb-4">
            This is a sample comment. Comments can also have reactions!
          </p>
          
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ReactionButton
                emoji="👍"
                count={2}
                isActive={false}
                onClick={handleReaction}
              />
              <ReactionButton
                emoji="❤️"
                count={1}
                isActive={true}
                onClick={handleReaction}
              />
              
              <ReactionPicker
                onEmojiSelect={handleReaction}
                className="scale-90"
              />
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">
            How to enable reactions in production:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Run the database migration SQL in your Supabase Dashboard</li>
            <li>The reactions table and triggers will be created</li>
            <li>Reactions will work on actual posts and comments</li>
            <li>Users can add/remove emoji reactions</li>
            <li>Reaction counts are automatically updated</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white rounded border">
            <h4 className="font-semibold mb-2">Database Migration Required:</h4>
            <p className="text-sm text-gray-600">
              Copy the SQL from <code>db/migrations/add_reactions_table.sql</code> 
              and run it in your Supabase SQL Editor to enable reactions functionality.
            </p>
          </div>
        </Card>

        {/* Translation Test */}
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-green-800">
            Translation Test:
          </h3>
          <div className="space-y-2 text-green-700">
            <p><strong>Add Reaction:</strong> {t('addReaction')}</p>
            <p><strong>Remove Reaction:</strong> {t('removeReaction')}</p>
            <p><strong>Login to React:</strong> {t('loginToReact')}</p>
            <p><strong>Reaction Failed:</strong> {t('reactionFailed')}</p>
            <p><strong>Select Emoji:</strong> {t('selectEmoji')}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
