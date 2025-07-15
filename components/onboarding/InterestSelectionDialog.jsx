'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getTrendingTags, getTopicCategories, saveUserInterests } from '@/lib/recommend/coldStart';
import { useSession } from 'next-auth/react';

const InterestSelectionDialog = ({ isOpen, onClose }) => {
  const { data: session } = useSession();
  const user = session?.user;
  
  const [topics, setTopics] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [topicsData, tagsData] = await Promise.all([
          getTopicCategories(),
          getTrendingTags(30) // Get top 30 tags
        ]);
        
        setTopics(topicsData);
        setTags(tagsData);
      } catch (error) {
        console.error('Error fetching topics and tags:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      await saveUserInterests(user.id, selectedTopics, selectedTags);
      onClose();
    } catch (error) {
      console.error('Error saving interests:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id) {
      onClose();
      return;
    }
    
    try {
      setSaving(true);
      // Save empty interests with skipped flag to prevent the dialog from showing again
      await saveUserInterests(user.id, [], []);
      onClose();
    } catch (error) {
      console.error('Error saving skipped interests:', error);
    } finally {
      setSaving(false);
    }
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
            disabled={saving}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (selectedTopics.length === 0 && selectedTags.length === 0)}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterestSelectionDialog; 