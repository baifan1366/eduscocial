'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useAuth from '@/hooks/useAuth';
import useGetRecommendTopics from '@/hooks/useGetRecommendTopics';
import useGetRecommendTags from '@/hooks/useGetRecommendTags';
import useUpdateUserInterests from '@/hooks/useUpdateUserInterests';

const InterestSelectionDialog = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [updatingEmbedding, setUpdatingEmbedding] = useState(false);

  // Fetch topics using React Query
  const { 
    data: topicsData, 
    isLoading: topicsLoading,
    error: topicsError 
  } = useGetRecommendTopics({
    enabled: isOpen, // Only fetch when dialog is open
  });
  
  // Fetch tags using React Query
  const {
    data: tagsData,
    isLoading: tagsLoading,
    error: tagsError
  } = useGetRecommendTags({ limit: 30 }, {
    enabled: isOpen, // Only fetch when dialog is open
  });
  
  // Get topics and tags from the API responses
  const topics = topicsData?.topics || [];
  const tags = tagsData?.tags || [];
  
  // Use mutation hook for saving interests
  const { 
    mutate: updateInterests, 
    isPending: saving,
    isError: saveError,
    error: saveErrorData
  } = useUpdateUserInterests({
    onSuccess: async () => {
      // After saving interests, trigger embedding update
      if (user?.id) {
        try {
          setUpdatingEmbedding(true);
          
          // Call API to update user embedding immediately
          const response = await fetch('/api/users/update-embedding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              forceRefresh: true,
              lookbackDays: 30
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update user embedding');
          }
          
        } catch (error) {
          console.error('Error updating user embedding:', error);
          // Non-blocking error - we still close the dialog
        } finally {
          setUpdatingEmbedding(false);
          onClose();
        }
      } else {
        onClose();
      }
    }
  });
  
  // Check if any data is still loading
  const loading = topicsLoading || tagsLoading;
  
  // Check for errors
  const error = topicsError || tagsError || saveError;
  
  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Error:', error);
    }
  }, [error]);

  const handleTopicToggle = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSave = () => {
    if (!user?.id) return;
    
    // Call the mutation with the selected interests
    updateInterests({
      selectedTopics,
      selectedTags
    });
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Personalize Your Feed</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select topics and tags that interest you to customize your content feed
          </p>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Topics Section */}
            <div>
              <h3 className="font-medium mb-3">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      selectedTopics.includes(topic.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleTopicToggle(topic.id)}
                  >
                    {topic.name}
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Tags Section */}
            <div>
              <h3 className="font-medium mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Card
                    key={tag.id}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    #{tag.name}
                    <span className="ml-2 text-xs opacity-70">
                      {tag.usage_count}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={saving || updatingEmbedding}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || updatingEmbedding || (selectedTopics.length === 0 && selectedTags.length === 0)}
          >
            {saving || updatingEmbedding ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterestSelectionDialog; 