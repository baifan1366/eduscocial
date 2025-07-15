'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useSettings from '@/hooks/useSettings';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function GeneralSettings() {
  const { settings, loading, updateSetting } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [blockedCards, setBlockedCards] = useState([]);
  const [hiddenBoards, setHiddenBoards] = useState([]);
  const [boards, setBoards] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const t = useTranslations('Settings');
  
  // Fetch boards for the hidden boards list
  useEffect(() => {
    const fetchBoards = async () => {
      setIsLoadingBoards(true);
      try {
        const { data, error } = await supabase
          .from('boards')
          .select('id, name, slug')
          .order('name');
          
        if (error) {
          console.error('Error fetching boards:', error);
        } else {
          setBoards(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching boards:', err);
      } finally {
        setIsLoadingBoards(false);
      }
    };
    
    fetchBoards();
  }, []);
  
  // Load blocked cards and hidden boards from settings
  useEffect(() => {
    if (!loading && settings) {
      setBlockedCards(settings?.general?.blockedCards || []);
      setHiddenBoards(settings?.general?.hiddenBoards || []);
    }
  }, [settings, loading]);
  
  // Handle notification toggle
  const handleNotificationToggle = async (key, value) => {
    setIsSaving(true);
    await updateSetting(`general.notifications.${key}`, value);
    setIsSaving(false);
  };
  
  // Handle visibility change
  const handleVisibilityChange = async (key, value) => {
    setIsSaving(true);
    await updateSetting(`general.visibility.${key}`, value);
    setIsSaving(false);
  };
  
  // Handle content protection toggle
  const handleContentProtectionToggle = async (key, value) => {
    setIsSaving(true);
    await updateSetting(`general.contentProtection.${key}`, value);
    setIsSaving(false);
  };
  
  // Handle removing a blocked card
  const handleRemoveBlockedCard = async (cardName) => {
    setIsSaving(true);
    const updatedBlockedCards = blockedCards.filter(name => name !== cardName);
    setBlockedCards(updatedBlockedCards);
    await updateSetting('general.blockedCards', updatedBlockedCards);
    setIsSaving(false);
  };
  
  // Handle removing a hidden board
  const handleRemoveHiddenBoard = async (boardId) => {
    setIsSaving(true);
    const updatedHiddenBoards = hiddenBoards.filter(id => id !== boardId);
    setHiddenBoards(updatedHiddenBoards);
    await updateSetting('general.hiddenBoards', updatedHiddenBoards);
    setIsSaving(false);
  };
  
  // Handle adding a new blocked card name
  const handleAddBlockedCard = async (event) => {
    event.preventDefault();
    const cardName = event.target.cardName.value.trim();
    if (!cardName) return;
    
    setIsSaving(true);
    const updatedBlockedCards = [...blockedCards, cardName];
    setBlockedCards(updatedBlockedCards);
    await updateSetting('general.blockedCards', updatedBlockedCards);
    event.target.cardName.value = '';
    setIsSaving(false);
  };
  
  // Handle adding a new hidden board
  const handleAddHiddenBoard = async (event) => {
    event.preventDefault();
    const boardId = event.target.boardId.value;
    if (!boardId || hiddenBoards.includes(boardId)) return;
    
    setIsSaving(true);
    const updatedHiddenBoards = [...hiddenBoards, boardId];
    setHiddenBoards(updatedHiddenBoards);
    await updateSetting('general.hiddenBoards', updatedHiddenBoards);
    setIsSaving(false);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <Card className="p-6 mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Notifications Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('notificationsTitle')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('emailNotifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('emailNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.general?.notifications?.email || false}
              onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('pushNotifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('pushNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.general?.notifications?.push || false}
              onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('mentionNotifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('mentionNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.general?.notifications?.mentions || false}
              onCheckedChange={(checked) => handleNotificationToggle('mentions', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('commentNotifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('commentNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.general?.notifications?.comments || false}
              onCheckedChange={(checked) => handleNotificationToggle('comments', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('likeNotifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('likeNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={settings?.general?.notifications?.likes || false}
              onCheckedChange={(checked) => handleNotificationToggle('likes', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>
      
      {/* Content Protection Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Content Protection</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sensitive content protection</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Turning off this setting means I am at least 18 years old, and I am willing to browse specific boards containing sensitive content. Android users who are at least 18 years old can download the full version here to browse specific boards.
              </p>
            </div>
            <Switch 
              checked={settings?.general?.contentProtection?.sensitiveContent || true}
              onCheckedChange={(checked) => handleContentProtectionToggle('sensitiveContent', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Blur sensitive images</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Turning off this setting means I am at least 18 years old, and I will see clear, unblurred sensitive images in the article list
              </p>
            </div>
            <Switch 
              checked={settings?.general?.contentProtection?.blurImages || true}
              onCheckedChange={(checked) => handleContentProtectionToggle('blurImages', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </Card>
      
      {/* Blocked Card Names Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Card Name Blocklist</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add the card names you want to block here. Cards with these names will not be displayed in your recommended content.
          </p>
          
          {/* List of blocked card names */}
          <div className="mt-4">
            {blockedCards.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No blocked cards</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockedCards.map((cardName, index) => (
                  <div 
                    key={index} 
                    className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-1"
                  >
                    <span className="mr-2">{cardName}</span>
                    <button 
                      onClick={() => handleRemoveBlockedCard(cardName)}
                      disabled={isSaving}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Form to add new blocked card name */}
          <form onSubmit={handleAddBlockedCard} className="flex gap-2 mt-4">
            <input
              type="text"
              name="cardName"
              placeholder="Enter card name"    
              className="flex-1 border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              disabled={isSaving}
            />
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add
            </Button>
          </form>
        </div>
      </Card>
      
      {/* Hidden Boards Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Hidden Boards List</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add the boards you want to hide here. These boards will not be displayed in your recommended content.
          </p>
          
          {/* List of hidden boards */}
          <div className="mt-4">
            {hiddenBoards.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hidden boards</p>
            ) : (
              <div className="flex flex-col gap-2">
                {hiddenBoards.map((boardId) => {
                  const board = boards.find(b => b.id === boardId);
                  return (
                    <div 
                      key={boardId} 
                      className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2"
                    >
                      <span>{board ? board.name : boardId}</span>
                      <button 
                        onClick={() => handleRemoveHiddenBoard(boardId)}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Form to add new hidden board */}
          <form onSubmit={handleAddHiddenBoard} className="flex gap-2 mt-4">
            <select
              name="boardId"
              className="flex-1 border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              disabled={isSaving || isLoadingBoards}
            >
              <option value="">Select a board</option>
              {boards.map(board => (
                <option 
                  key={board.id} 
                  value={board.id}
                  disabled={hiddenBoards.includes(board.id)}
                >
                  {board.name}
                </option>
              ))}
            </select>
            <Button 
              type="submit" 
              disabled={isSaving || isLoadingBoards}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              添加
            </Button>
          </form>
        </div>
      </Card>
      
      {/* Visibility Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">{t('visibilityTitle')}</h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('profileVisibility')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.general?.visibility?.profile || 'public'}
              onChange={(e) => handleVisibilityChange('profile', e.target.value)}
              disabled={isSaving}
            >
              <option value="public">{t('public')}</option>
              <option value="friends">{t('friends')}</option>
              <option value="private">{t('private')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('profileVisibilityDesc')}</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('activityVisibility')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.general?.visibility?.activity || 'friends'}
              onChange={(e) => handleVisibilityChange('activity', e.target.value)}
              disabled={isSaving}
            >
              <option value="public">{t('public')}</option>
              <option value="friends">{t('friends')}</option>
              <option value="private">{t('private')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('activityVisibilityDesc')}</p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="font-medium">{t('emailVisibility')}</label>
            <select 
              className="border rounded-md p-2 bg-white dark:bg-gray-800 dark:border-gray-700"
              value={settings?.general?.visibility?.email || 'private'}
              onChange={(e) => handleVisibilityChange('email', e.target.value)}
              disabled={isSaving}
            >
              <option value="public">{t('public')}</option>
              <option value="friends">{t('friends')}</option>
              <option value="private">{t('private')}</option>
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('emailVisibilityDesc')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 