'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';
import useCheckNewUser from '@/hooks/useCheckNewUser';

export default function NewUserInterestCheck() {
  const { data: session, status } = useSession();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  
  // Use React Query hook to check if user is new
  const { 
    data, 
    isSuccess 
  } = useCheckNewUser({
    // Only run query when user is authenticated
    enabled: status === 'authenticated' && !!session?.user?.id,
    // Don't refetch on window focus as this check should be done only once per session
    refetchOnWindowFocus: false,
  });
  
  // Show interest dialog when data is fetched and user is new
  useEffect(() => {
    if (isSuccess && data?.isNewUser) {
      setShowInterestDialog(true);
    }
  }, [isSuccess, data]);
  
  const handleCloseInterestDialog = () => {
    setShowInterestDialog(false);
    // Refresh page to get personalized recommendations
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