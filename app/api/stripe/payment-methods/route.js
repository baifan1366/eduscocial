import { NextResponse } from 'next/server';
import { getServerSession } from "@/lib/auth/serverAuth";

export async function GET(request) {
    try {
        // Get user session for authentication
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const currency = searchParams.get('currency') || 'usd';
        const country = searchParams.get('country') || 'US';

        // Define supported payment methods by currency/region
        const paymentMethodsByRegion = {
            'myr': {
                country: 'MY',
                methods: [
                    {
                        type: 'card',
                        name: 'Credit/Debit Card',
                        description: 'Visa, Mastercard, American Express',
                        icon: '/visa.webp',
                        enabled: true
                    },
                    {
                        type: 'fpx',
                        name: 'FPX',
                        description: 'Malaysian online banking',
                        icon: '/payment-icons/fpx.svg',
                        enabled: true
                    },
                    {
                        type: 'grabpay',
                        name: 'GrabPay',
                        description: 'Pay with GrabPay wallet',
                        icon: '/grab-pay.png',
                        enabled: true
                    },
                    {
                        type: 'alipay',
                        name: 'Alipay',
                        description: 'Pay with Alipay',
                        icon: '/alipay.webp',
                        enabled: true
                    }
                ]
            },
            'usd': {
                country: 'US',
                methods: [
                    {
                        type: 'card',
                        name: 'Credit/Debit Card',
                        description: 'Visa, Mastercard, American Express',
                        icon: '/visa.webp',
                        enabled: true
                    },
                    {
                        type: 'us_bank_account',
                        name: 'US Bank Account',
                        description: 'Pay directly from your bank account',
                        icon: '/payment-icons/bank.svg',
                        enabled: true
                    },
                    {
                        type: 'alipay',
                        name: 'Alipay',
                        description: 'Pay with Alipay',
                        icon: '/alipay.webp',
                        enabled: true
                    }
                ]
            },
            'eur': {
                country: 'DE',
                methods: [
                    {
                        type: 'card',
                        name: 'Credit/Debit Card',
                        description: 'Visa, Mastercard, American Express',
                        icon: '/visa.webp',
                        enabled: true
                    },
                    {
                        type: 'sepa_debit',
                        name: 'SEPA Direct Debit',
                        description: 'European bank transfer',
                        icon: '/payment-icons/sepa.svg',
                        enabled: true
                    },
                    {
                        type: 'sofort',
                        name: 'Sofort',
                        description: 'German online banking',
                        icon: '/payment-icons/sofort.svg',
                        enabled: true
                    },
                    {
                        type: 'ideal',
                        name: 'iDEAL',
                        description: 'Dutch online banking',
                        icon: '/payment-icons/ideal.svg',
                        enabled: true
                    }
                ]
            },
            'gbp': {
                country: 'GB',
                methods: [
                    {
                        type: 'card',
                        name: 'Credit/Debit Card',
                        description: 'Visa, Mastercard, American Express',
                        icon: '/payment-icons/card.svg',
                        enabled: true
                    },
                    {
                        type: 'bacs_debit',
                        name: 'Bacs Direct Debit',
                        description: 'UK bank transfer',
                        icon: '/payment-icons/bacs.svg',
                        enabled: true
                    }
                ]
            }
        };

        const regionData = paymentMethodsByRegion[currency.toLowerCase()] || paymentMethodsByRegion['usd'];

        return NextResponse.json({
            success: true,
            currency: currency.toUpperCase(),
            country: regionData.country,
            payment_methods: regionData.methods
        });

    } catch (error) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json({ 
            error: "Failed to fetch payment methods" 
        }, { status: 500 });
    }
}
