'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isNewUser } from '@/lib/redis/redisUtils';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';

export default function NewUserInterestCheck() {
  const { data: session, status } = useSession();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  
  useEffect(() => {
    const checkIfNewUser = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const userIsNew = await isNewUser(session.user.id);
          
          // Show interest selection dialog for new users
          if (userIsNew) {
            setShowInterestDialog(true);
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
    // Refresh the page to get personalized recommendations
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