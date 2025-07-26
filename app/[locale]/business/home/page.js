import { Suspense } from 'react';

export const metadata = {
  title: 'Home | Business | EduSocial',
  description: 'Business home page',
  openGraph: {
    title: 'Business Home Page',
    images: ['/slogan-removebg-preview.png'],
  },
};

function HomeLoader() {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Row 1: Four Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl shadow-md"
              style={{ backgroundColor: i % 2 === 0 ? '#1E3A5F' : '#132F4C' }}
            >
              <div className="h-full w-3/4 mx-auto mt-6 bg-white/20 rounded" />
            </div>
          ))}
        </div>
  
        {/* Row 2: Two Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl shadow-md"
              style={{ backgroundColor: '#1E3A5F' }}
            >
              <div className="h-full w-full px-6 pt-10">
                <div className="w-1/3 h-5 bg-white/20 rounded mb-4" />
                <div className="w-full h-40 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
  
        {/* Row 3: Two Half-Width Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl shadow-md flex flex-col justify-center px-6"
              style={{ backgroundColor: '#FF7D00' }}
            >
              <div className="w-1/4 h-4 bg-white/30 rounded mb-2" />
              <div className="w-2/3 h-6 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
}  

export default function BusinessHomePage() {
  return (
    <main>
      <div className="max-w-md mx-auto py-0 min-w-[80%]">
        <Suspense fallback={<HomeLoader />}>
        <h2>Welcome Back, Business Partner</h2>
        </Suspense>
      </div>
    </main>
  );
}
