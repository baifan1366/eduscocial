import { Suspense } from 'react';
import CheckoutForm from '@/components/business/payments/CheckoutForm';
import StripePayment from '@/components/business/payments/StripePayment';
import { CheckoutProvider } from '@/hooks/business/payments/useCheckout';
import CheckoutErrorBoundary from '@/components/business/payments/CheckoutErrorBoundary';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl shadow-md"
              style={{ backgroundColor: i % 2 === 0 ? '#1E3A5F' : '#132F4C' }}
            >
              <div className="h-full w-3/4 mx-auto mt-6 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
}  

export default async function CheckOutPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams?.orderId;

  // Debug logging
  console.log('CheckOutPage - orderId:', orderId);

  return (
    <main className="container mx-auto py-8">
      <CheckoutErrorBoundary>
        <CheckoutProvider orderId={orderId}>
          <div className="flex flex-col lg:flex-row gap-8">
            <Suspense fallback={<CheckOutLoader />}>
              <div className="w-full lg:w-1/2">
                <CheckoutForm />
              </div>
              <div className="w-full lg:w-1/2">
                <StripePayment />
              </div>
            </Suspense>
          </div>
        </CheckoutProvider>
      </CheckoutErrorBoundary>
    </main>
  );
}