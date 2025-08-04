import CheckoutPageClient from '@/components/business/payments/CheckoutPageClient';

export const metadata = {
  title: 'Checkout | EduSocial',
  description: 'Checkout page',
  openGraph: {
    title: 'Checkout Page',
    images: ['/slogan-removebg-preview.png'],
  },
};

export default async function CheckOutPage({ searchParams, params }) {
  // Handle both sync and async searchParams and params
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;

  // Get orderId from query parameters
  const orderId = resolvedSearchParams?.orderId;

  // Pass orderId to client component for handling
  return <CheckoutPageClient orderId={orderId} />;
}