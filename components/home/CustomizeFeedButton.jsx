'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import InterestSelectionDialog from '@/components/onboarding/InterestSelectionDialog';
import { useSession } from 'next-auth/react';
import { getHomePagePosts } from '@/lib/recommend/coldStart';

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
        variant="outline" 
        className="w-full mb-2"
      >
        Customize Feed
      </Button>
      
      <InterestSelectionDialog
        isOpen={showInterestDialog}
        onClose={handleCloseInterestDialog}
      />
    </>
  );
} 