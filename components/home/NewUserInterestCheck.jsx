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
        // Check if we're coming back from a refresh after closing the dialog
        const searchParams = new URLSearchParams(window.location.search);
        const refreshParam = searchParams.get('refresh');
        
        // If we have a refresh parameter, don't show the dialog again
        if (refreshParam) {
          return;
        }
        
        try {
          const userIsNew = await isNewUser(session.user.id);
          
          // Show interest selection dialog for new users
          // Only show dialog if we got a definitive "true" response
          if (userIsNew === true) {
            setShowInterestDialog(true);
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          // Don't show dialog if there was an error checking user status
          setShowInterestDialog(false);
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