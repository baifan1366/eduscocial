'use client';

import { Card } from '@/components/ui/card';
import { Hash } from 'lucide-react';

export default function MyTopicsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Topics I follow</h1>
      
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="text-center py-12 flex flex-col items-center">
          <Hash className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-300">You are not currently following any topics</p>
          <button className="mt-4 px-4 py-2 bg-[#1E4976] hover:bg-blue-700 text-white rounded-lg">
          Browse Topics
          </button>
        </div>
      </Card>
    </div>
  );
} 