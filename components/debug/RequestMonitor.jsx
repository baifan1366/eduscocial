'use client';

import { useState, useEffect } from 'react';
import requestDeduplicator from '@/lib/utils/requestDeduplication';

/**
 * Development component to monitor request deduplication stats
 * Only shows in development mode
 */
export default function RequestMonitor() {
  const [stats, setStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateStats = () => {
      setStats(requestDeduplicator.getStats());
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
      >
        📊 Requests
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Request Stats</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cache Size:</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.cacheSize || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pending Requests:</span>
              <span className="font-medium text-gray-900 dark:text-white">{stats.pendingRequests || 0}</span>
            </div>
            
            {stats.cacheKeys && stats.cacheKeys.length > 0 && (
              <div className="mt-3">
                <div className="text-gray-600 dark:text-gray-400 mb-1">Cached Keys:</div>
                <div className="max-h-32 overflow-y-auto">
                  {stats.cacheKeys.map((key, index) => (
                    <div key={index} className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => {
                  requestDeduplicator.clearAllCache();
                  setStats(requestDeduplicator.getStats());
                }}
                className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
