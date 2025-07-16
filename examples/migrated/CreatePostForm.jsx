'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useCreatePost from '@/hooks/useCreatePost';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreatePostForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  // Use the React Query mutation hook
  const { 
    mutate: createPost, 
    isPending, 
    isError,
    error
  } = useCreatePost({
    // Navigate to the post page on success
    onSuccess: (data) => {
      router.push(`/posts/${data.id}`);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process tags from comma-separated string to array
    const processedData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };
    
    // Call the mutation function
    createPost(processedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter post title"
          required
          disabled={isPending}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Write your post content here..."
          rows={6}
          required
          disabled={isPending}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g. tech, news, programming"
          disabled={isPending}
        />
      </div>
      
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error?.message || 'Failed to create post. Please try again.'}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <span className="mr-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Creating...
          </>
        ) : (
          'Create Post'
        )}
      </Button>
    </form>
  );
} 