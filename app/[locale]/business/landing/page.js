import { Suspense } from 'react';

export const metadata = {
  title: 'Landing | EduSocial',
  description: 'Business dashboard for EduSocial',
};

function BusinessDashboardContent() {
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome Back, Business Partner</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Campaign Performance</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-300">Active Campaigns</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <div>
              <p className="text-gray-300">Total Impressions</p>
              <p className="text-2xl font-bold text-white">24,582</p>
            </div>
            <div>
              <p className="text-gray-300">Click-through Rate</p>
              <p className="text-2xl font-bold text-white">3.2%</p>
            </div>
          </div>
        </div>

        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-[#FF7D00] pl-4">
              <p className="text-white">Campaign "Summer Promotion" started</p>
              <p className="text-sm text-gray-300">Yesterday</p>
            </div>
            <div className="border-l-4 border-[#FF7D00] pl-4">
              <p className="text-white">New user engagement: +15%</p>
              <p className="text-sm text-gray-300">3 days ago</p>
            </div>
            <div className="border-l-4 border-[#FF7D00] pl-4">
              <p className="text-white">Ad performance report available</p>
              <p className="text-sm text-gray-300">1 week ago</p>
            </div>
          </div>
        </div>

        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button className="bg-[#FF7D00] hover:bg-orange-500 text-white py-2 px-4 rounded-md w-full">
              Create New Campaign
            </button>
            <button className="bg-[#1E3A5F] hover:bg-[#2D4D6E] text-white py-2 px-4 rounded-md w-full">
              View Analytics
            </button>
            <button className="bg-[#1E3A5F] hover:bg-[#2D4D6E] text-white py-2 px-4 rounded-md w-full">
              Manage Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8">
      <div className="h-8 bg-[#1E3A5F] rounded mb-6 w-1/3 animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-6 bg-[#1E3A5F] rounded mb-4 w-3/4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-1/2"></div>
              <div className="h-6 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-1/2"></div>
              <div className="h-6 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-1/2"></div>
              <div className="h-6 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-6 bg-[#1E3A5F] rounded mb-4 w-3/4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
            <div>
              <div className="h-4 bg-[#1E3A5F] rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-[#1E3A5F] rounded w-1/4"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#132F4C] p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-6 bg-[#1E3A5F] rounded mb-4 w-3/4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-[#1E3A5F] rounded"></div>
            <div className="h-10 bg-[#1E3A5F] rounded"></div>
            <div className="h-10 bg-[#1E3A5F] rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BusinessDashboardContent />
    </Suspense>
  );
}
