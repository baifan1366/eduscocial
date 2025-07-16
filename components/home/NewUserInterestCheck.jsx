'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';

export default function NewUserInterestCheck() {
  const { data: session, status } = useSession();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  
  useEffect(() => {
    const checkIfNewUser = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          // 使用API路由检查是否为新用户
          const response = await fetch('/api/recommend/check-new-user');
          
          if (response.ok) {
            const data = await response.json();
            
            // 为新用户显示兴趣选择对话框
            if (data.isNewUser) {
              setShowInterestDialog(true);
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      }
    };
    
    checkIfNewUser();
  }, [status, session]);
  
  const handleCloseInterestDialog = () => {
    setShowInterestDialog(false);
    // 刷新页面以获取个性化推荐
    window.location.href = window.location.pathname + '?refresh=' + Date.now();
  };

  if (!showInterestDialog) {
    return null;
  }

  return (
    <InterestSelectionDialog
      isOpen={showInterestDialog}
      onClose={handleCloseInterestDialog}
    />
  );
} 