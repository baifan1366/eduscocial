'use client';

import useAuth from '@/hooks/useAuth';
import { useProfile } from '@/contexts/profile-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import useMyCards from '@/hooks/useMyCards';

export default function MyPageClient() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [cardData, setCardData] = useState({ id: '', name: '' });
  
  const { cards, isLoading, createCard, isCreating, createError } = useMyCards();

  // Handle Add New Card Block button click
  const handleAddCardBlock = () => {
    setShowCardDialog(true);
  };

  // Handle card creation
  const handleCreateCard = async () => {
    if (!cardData.id.trim() || !cardData.name.trim()) {
      toast.error('Please fill in both ID and card name');
      return;
    }

    // Validate ID format (15 characters max, alphanumeric)
    if (cardData.id.length > 15 || !/^[a-zA-Z0-9]+$/.test(cardData.id)) {
      toast.error('ID must be alphanumeric and max 15 characters');
      return;
    }

    // Validate card name (12 characters max)
    if (cardData.name.length > 12) {
      toast.error('Card name must be max 12 characters');
      return;
    }

    try {
      await createCard({
        id: cardData.id,
        name: cardData.name,
      });
      
      toast.success('Card created successfully!');
      setShowCardDialog(false);
      setCardData({ id: '', name: '' });
    } catch (error) {
      toast.error(createError?.message || 'Failed to create card');
    }
  };

  return (
    <>
      <div className={`space-y-6 ${showCardDialog ? 'blur-sm' : ''} transition-all duration-300`}>
        <h1 className="text-3xl font-bold text-white">My Personal Wall</h1>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Private Button */}
            <button className="flex items-center justify-center w-9 h-9 bg-teal-600 rounded-full text-white hover:bg-teal-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <span className="text-white text-sm">私人</span>
          </div>

          {/* Add New Card Block Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAddCardBlock}
              className="flex items-center justify-center w-9 h-9 bg-white rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
            <span className="text-white text-sm">新增卡称</span>
          </div>
        </div>

        {/* User Cards Section */}
        <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
          {/* Cards Display */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-t-[#FF7D00] border-gray-300 rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-gray-400">Loading cards...</p>
            </div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {cards.map((card, index) => (
                <div key={card.id} className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-2">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={card.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-[#FF7D00] rounded-full flex items-center justify-center ${profile?.avatarUrl ? 'hidden' : ''}`}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium">{card.name}</p>
                  <p className="text-gray-400 text-xs">@{card.card_id}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-4">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile Picture"
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 bg-[#FF7D00] rounded-full flex items-center justify-center ${profile?.avatarUrl ? 'hidden' : ''}`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">
                {profile?.displayName || user?.name || '私人'}
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                {profile?.university || 'School name'}
                {profile?.department && profile?.university && ' - '}
                {profile?.department || ''}
              </p>
              <div className="text-gray-300 mb-1">0</div>
              <div className="text-gray-400 text-sm">文章</div>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-gray-600 my-6"></div>

          {/* Empty State Message */}
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">尚未发表任何文章</p>
          </div>
        </Card>
      </div>

      {/* Create Card Dialog */}
      {showCardDialog && (
        <div className="fixed inset-0 bg-opacity-80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#132F4C] rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-600">
            {/* Dialog Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">创建卡称</h3>
              <button
                onClick={() => setShowCardDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                卡称是在 Dcard 专属的个人昵称，你可以使用这个昵称发文或是留言。
              </p>

              {/* ID Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ID
                </label>
                <input
                  type="text"
                  value={cardData.id}
                  onChange={(e) => setCardData({ ...cardData, id: e.target.value })}
                  placeholder="输入你的 ID（15 个字元以内）"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7D00] focus:border-transparent"
                  maxLength={15}
                />
                <p className="text-xs text-gray-400 mt-1">
                  小写英数字，首字需为英文字母，最长 15 个字元，不可包含 dcard 字串，且后可修改一次。
                </p>
              </div>

              {/* Card Name Field */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  卡称
                </label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                  placeholder="输入你的卡称（12 个字以内）"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF7D00] focus:border-transparent"
                  maxLength={12}
                />
                <p className="text-xs text-gray-400 mt-1">
                  最长 12 个字元（2 个半形字母或数字为 1 个字元），不可包含「dcard」、「狄卡」，不可包含 dcard、狄卡字串。
                </p>
              </div>

              {/* Checkbox */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agreement"
                  className="mt-1 h-4 w-4 text-[#FF7D00] focus:ring-[#FF7D00] bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="agreement" className="text-sm text-gray-300">
                  我知道 ID 日后不能更改，且若与其他平台使用相同的 ID 或卡称可能会混淆真实身份
                </label>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCardDialog(false)}
                disabled={isCreating}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                取消再说
              </Button>
              <Button
                onClick={handleCreateCard}
                disabled={isCreating}
                className="bg-[#FF7D00] hover:bg-[#FF7D00]/90 text-white"
              >
                {isCreating ? '创建中...' : '送出'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}