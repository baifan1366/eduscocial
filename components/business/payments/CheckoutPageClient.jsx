'use client';

import { Suspense } from 'react';
import CheckoutForm from '@/components/business/payments/CheckoutForm';
import { CheckoutProvider } from '@/hooks/business/payments/useCheckout';
import CheckoutErrorBoundary from '@/components/business/payments/CheckoutErrorBoundary';
import { useTranslations } from 'next-intl';

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

export default function CheckoutPageClient({ orderId }) {
  const t = useTranslations('Checkout');

  // Validate orderId format (UUID should be 36 characters with dashes)
  const isValidUUID = orderId && orderId.length >= 36 && orderId.includes('-');

  if (!orderId) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('missingOrderId')}</h1>
          <p className="mb-4">{t('noOrderIdProvided')}</p>
          <a href="/business/payments-and-credits/buy-credits" className="text-blue-600 hover:underline">
            {t('returnToCreditPlans')}
          </a>
        </div>
      </main>
    );
  }

  if (!isValidUUID) {
    console.error('Invalid or truncated orderId detected:', orderId);
    return (
      <main className="container mx-auto py-8">
        <CheckoutErrorBoundary/>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8">
      <CheckoutErrorBoundary>
        <CheckoutProvider orderId={orderId}>
          <div className="flex justify-center">
            <Suspense fallback={<CheckOutLoader />}>
              <div className="w-full max-w-2xl">
                <CheckoutForm />
              </div>
            </Suspense>
          </div>
        </CheckoutProvider>
      </CheckoutErrorBoundary>
    </main>
  );
}
