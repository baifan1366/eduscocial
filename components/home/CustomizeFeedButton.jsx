'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';
import { useSession } from 'next-auth/react';

export default function CustomizeFeedButton() {
  const { data: session } = useSession();
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  
  const handleCloseInterestDialog = () => {
    setShowInterestDialog(false);
    
    // We would ideally refresh the posts here, but since this is a client component
    // and the main page is a server component, we'll use a URL-based approach
    // to trigger a server refresh (handled in the parent)
    window.location.href = window.location.pathname + '?refresh=' + Date.now();
  };
  
  return (
    <>
      <Button 
        onClick={() => setShowInterestDialog(true)}
        className="w-full mb-2 bg-orange-500 hover:bg-orange-600 text-white"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
          />
        </svg>
        Customize Feed
      </Button>
      
      <InterestSelectionDialog
        isOpen={showInterestDialog}
        onClose={handleCloseInterestDialog}
      />
    </>
  );
} 