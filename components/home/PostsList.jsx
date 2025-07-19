'use client';

import { useState } from 'react';

export default function PostsList({ posts = [], isLoading, error }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#1E4976] rounded-full animate-pulse"></div>
              <div className="ml-3 space-y-2">
                <div className="h-4 bg-[#1E4976] rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-[#1E4976] rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="h-6 bg-[#1E4976] rounded w-3/4 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-[#1E4976] rounded w-full animate-pulse"></div>
              <div className="h-4 bg-[#1E4976] rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-white">Error loading posts</h3>
        <p className="text-gray-400">{error.message}</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-[#132F4C] rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold mb-4 text-white">No posts yet</h3>
        <p className="text-gray-400">Follow topics or users to see posts here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-[#132F4C] rounded-lg p-6 border border-[#1E3A5F]">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-[#1E4976] rounded-full"></div>
            <div className="ml-3">
              <p className="font-medium text-white">{post.author?.username || 'Anonymous'}</p>
              <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">{post.title}</h3>
          <p className="text-gray-300 mb-4">{post.content?.substring(0, 200)}...</p>
          <div className="flex items-center text-gray-400 text-sm">
            <span className="mr-4">{post.likes_count || 0} likes</span>
            <span>{post.comments_count || 0} comments</span>
          </div>
        </div>
      ))}
    </div>
  );
} 