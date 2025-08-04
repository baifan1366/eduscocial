'use client';

import { useQuery } from '@tanstack/react-query';
import { stripeApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * Hook for getting available Stripe payment methods
 * @returns {Object} Query object with payment methods data
 */
export function useStripePaymentMethods() {
    return useQuery({
        queryKey: queryKeys.payments.paymentMethods || ['payments', 'paymentMethods'],
        queryFn: async () => {
            const response = await stripeApi.getPaymentMethods();
            return response;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Get supported payment method types based on region/currency
 * @param {string} currency - Currency code (e.g., 'myr', 'usd')
 * @param {string} country - Country code (e.g., 'MY', 'US')
 * @returns {Array} Array of supported payment method types
 */
export function getSupportedPaymentMethods(currency = 'usd', country = 'US') {
    const paymentMethods = ['card']; // Card is always supported

    // Add global digital wallets (available in most regions)
    paymentMethods.push('alipay', 'apple_pay', 'google_pay');

    // Add region-specific payment methods
    switch (currency.toLowerCase()) {
        case 'myr':
            // Malaysian Ringgit - add local payment methods
            paymentMethods.push('fpx', 'grabpay');
            break;
        case 'sgd':
            // Singapore Dollar
            paymentMethods.push('grabpay');
            break;
        case 'thb':
            // Thai Baht
            paymentMethods.push('grabpay');
            break;
        case 'usd':
            // US Dollar - add US-specific payment methods
            paymentMethods.push('us_bank_account', 'cashapp');
            break;
        case 'eur':
            // Euro - add European payment methods
            paymentMethods.push('sepa_debit', 'sofort', 'ideal', 'bancontact', 'eps', 'giropay', 'p24');
            break;
        case 'gbp':
            // British Pound - add UK payment methods
            paymentMethods.push('bacs_debit');
            break;
        case 'cad':
            // Canadian Dollar
            paymentMethods.push('acss_debit');
            break;
        case 'aud':
            // Australian Dollar
            paymentMethods.push('au_becs_debit');
            break;
    }

    // Add WeChat Pay for supported currencies
    if (['usd', 'eur', 'cny', 'hkd', 'sgd', 'myr'].includes(currency.toLowerCase())) {
        paymentMethods.push('wechat_pay');
    }

    // Remove duplicates using Set and return as array
    return [...new Set(paymentMethods)];
}

/**
 * Get payment method display information
 * @param {string} paymentMethodType - Payment method type
 * @returns {Object} Display information for the payment method
 */
export function getPaymentMethodInfo(paymentMethodType) {
    const paymentMethodsInfo = {
        card: {
            name: 'Cards',
            icon: '/visa.webp',
            description: 'Visa, Mastercard, American Express',
            requiresSetup: false,
            type: 'Cards'
        },
        alipay: {
            name: 'Alipay',
            icon: '/alipay.webp',
            description: 'Digital wallet popular in China',
            requiresSetup: false,
            type: 'Wallet'
        },
        apple_pay: {
            name: 'Apple Pay',
            icon: '/apple-pay.webp',
            description: 'Pay with Touch ID or Face ID',
            requiresSetup: false,
            type: 'Wallet'
        },
        google_pay: {
            name: 'Google Pay',
            icon: '/google-pay.webp',
            description: 'Pay with your Google account',
            requiresSetup: false,
            type: 'Wallet'
        },
        grabpay: {
            name: 'GrabPay',
            icon: '/grab-pay.png',
            description: 'Popular in Malaysia & Singapore',
            requiresSetup: false,
            type: 'Wallet'
        },
        link: {
            name: 'Link',
            icon: '/payment-icons/link.svg',
            description: 'Pay with Link by Stripe',
            requiresSetup: false,
            type: 'Wallet'
        },
        wechat_pay: {
            name: 'WeChat Pay',
            icon: '/payment-icons/wechat.svg',
            description: 'Pay with WeChat Pay',
            requiresSetup: false,
            type: 'Wallet'
        },
        fpx: {
            name: 'FPX',
            icon: '/payment-icons/fpx.svg',
            description: 'Malaysian online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        us_bank_account: {
            name: 'US Bank Account',
            icon: '/payment-icons/bank.svg',
            description: 'Pay directly from your bank account',
            requiresSetup: true,
            type: 'Bank Transfer'
        },
        sepa_debit: {
            name: 'SEPA Direct Debit',
            icon: '/payment-icons/sepa.svg',
            description: 'European bank transfer',
            requiresSetup: true,
            type: 'Bank Transfer'
        },
        sofort: {
            name: 'Sofort',
            icon: '/payment-icons/sofort.svg',
            description: 'German online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        ideal: {
            name: 'iDEAL',
            icon: '/payment-icons/ideal.svg',
            description: 'Dutch online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        bacs_debit: {
            name: 'Bacs Direct Debit',
            icon: '/payment-icons/bacs.svg',
            description: 'UK bank transfer',
            requiresSetup: true,
            type: 'Bank Transfer'
        },
        bancontact: {
            name: 'Bancontact',
            icon: '/payment-icons/bancontact.svg',
            description: 'Belgian online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        eps: {
            name: 'EPS',
            icon: '/payment-icons/eps.svg',
            description: 'Austrian online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        giropay: {
            name: 'Giropay',
            icon: '/payment-icons/giropay.svg',
            description: 'German online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        p24: {
            name: 'Przelewy24',
            icon: '/payment-icons/p24.svg',
            description: 'Polish online banking',
            requiresSetup: false,
            type: 'Bank Transfer'
        },
        cashapp: {
            name: 'Cash App Pay',
            icon: '/payment-icons/cashapp.svg',
            description: 'Pay with Cash App',
            requiresSetup: false,
            type: 'Wallet'
        },
        acss_debit: {
            name: 'Canadian Bank Account',
            icon: '/payment-icons/bank.svg',
            description: 'Canadian pre-authorized debit',
            requiresSetup: true,
            type: 'Bank Transfer'
        },
        au_becs_debit: {
            name: 'Australian Bank Account',
            icon: '/payment-icons/bank.svg',
            description: 'Australian direct debit',
            requiresSetup: true,
            type: 'Bank Transfer'
        }
    };

    return paymentMethodsInfo[paymentMethodType] || {
        name: paymentMethodType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: '/payment-icons/default.svg',
        description: `Pay with ${paymentMethodType}`,
        requiresSetup: false,
        type: 'Other'
    };
}

export default useStripePaymentMethods;
