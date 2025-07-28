import { Suspense } from 'react';
import CheckoutForm from '@/components/business/payments/CheckoutForm';

export const metadata = {
  title: 'Checkout | EduSocial',
  description: 'Checkout page',
  openGraph: {
    title: 'Checkout Page',
    images: ['/slogan-removebg-preview.png'],
  },
};

function CheckOutLoader() {
    return (
      <div className="p-6 space-y-6 animate-pulse">
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
      </div>
    );
}  

export default function CheckOutPage() {
  return (
    <main>
      <div className="max-w-md mx-auto py-0 min-w-[100%]">
        <Suspense fallback={<CheckOutLoader />}>
            <CheckoutForm />
        </Suspense>
      </div>
    </main>
  );
}