'use client';

import { Card } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function MyCardsClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Cards I follow</h1>
      
      <Card className="p-6 bg-[#132F4C] shadow-md rounded-lg">
        <div className="text-center py-12 flex flex-col items-center">
          <CreditCard className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-300">You are not currently following any cards</p>
          <button className="mt-4 px-4 py-2 bg-[#FF7D00] hover:bg-[#FF7D00]/90 text-white rounded-lg transition-colors">
            Browse Cards
          </button>
        </div>
      </Card>
    </div>
  );
}