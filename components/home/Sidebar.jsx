import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CustomizeFeedButton from './CustomizeFeedButton';

export default function Sidebar({ isAuthenticated }) {
  return (
    <div className="md:col-span-1">
      <Card className="p-4 mb-6">
        <h2 className="font-bold mb-4">Discover</h2>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Trending
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved
          </Button>
        </div>
      </Card>
      
      {/* User section - Show only if logged in */}
      {isAuthenticated && (
        <Card className="p-4">
          <h2 className="font-bold mb-4">Your Feed</h2>
          <CustomizeFeedButton />
        </Card>
      )}
    </div>
  );
} 