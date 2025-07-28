import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const requestData = await request.json();
    const { amount, currency, planId, orderId } = requestData;

    // Map currency codes to Stripe-supported currencies
    const currencyMapping = {
      'rm': 'myr',  // Malaysian Ringgit
      'usd': 'usd', // US Dollar
      'eur': 'eur', // Euro
      'gbp': 'gbp', // British Pound
      // Add more mappings as needed
    };

    const stripeCurrency = currencyMapping[currency?.toLowerCase()] || 'usd';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: 'EduSocial Credits',
              description: `Credit purchase - Order ID: ${orderId}`,
            },
            unit_amount: amount || 1000, // 默认 $10.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        planId: planId || '',
        orderId: orderId || '',
      },
      success_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_URL}/business/payments-and-credits/buy-credits/checkout?status=success&orderId=${orderId}&planId=${planId}`,
      cancel_url: `${request.headers.get('origin') || process.env.NEXT_PUBLIC_URL}/business/payments-and-credits/buy-credits/checkout?status=cancel&orderId=${orderId}&planId=${planId}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}