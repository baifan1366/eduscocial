'use client';

import { useSession } from 'next-auth/react';

export default function MyPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-700 p-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {/* Private Button */}
          <button className="flex items-center justify-center w-12 h-12 bg-teal-600 rounded-full text-white hover:bg-teal-700 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <span className="text-white text-sm">Private</span>
        </div>
        
        {/* Add New Card Block Button */}
        <div className="flex items-center space-x-4">
          <button className="flex items-center justify-center w-12 h-12 bg-white rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <span className="text-white text-sm">Add New Card Block</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* User Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-sky-300 to-sky-600 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-sky-700 rounded-full flex items-center justify-center">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user?.name || 'User Avatar'} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-sky-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V5C15 3.34 13.67 2 12 2S9 3.34 9 5V5.5L3 7V9H21ZM12 8C12.55 8 13 8.45 13 9S12.55 10 12 10S11 9.55 11 9S11.45 8 12 8Z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="text-center">
            <h1 className="text-2xl font-medium text-gray-800 mb-2">{user?.name || 'Private'}</h1>
            <div className="text-gray-600 mb-1">0</div>
            <div className="text-gray-400 text-sm">Articles</div>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="text-center mt-12">
          <p className="text-gray-300 text-sm">No articles published yet</p>
        </div>
      </div>
    </div>
  );
} 