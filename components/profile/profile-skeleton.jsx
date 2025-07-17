'use client';

import { Card } from '@/components/ui/card';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="h-8 bg-gray-600 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
      
      {/* Profile header card skeleton */}
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="flex flex-col items-center py-4">
          {/* Avatar skeleton */}
          <div className="w-24 h-24 bg-gray-600 dark:bg-gray-700 rounded-lg mb-4 animate-pulse"></div>
          
          {/* User info skeleton */}
          <div className="h-6 bg-gray-600 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-600 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
      </Card>

      {/* Profile fields card skeleton */}
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="border-b border-gray-600 dark:border-gray-700 py-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Label skeleton */}
                  <div className="h-4 bg-gray-600 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                  {/* Value skeleton */}
                  <div className="h-5 bg-gray-600 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                </div>
                {/* Edit button skeleton */}
                <div className="w-8 h-8 bg-gray-600 dark:bg-gray-700 rounded ml-4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save button skeleton */}
      <div className="flex justify-center pb-6">
        <div className="h-12 bg-gray-600 dark:bg-gray-700 rounded-full w-32 animate-pulse"></div>
      </div>
    </div>
  );
}