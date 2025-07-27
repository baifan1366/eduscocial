'use client';

import useCheckout from "@/hooks/business/payments/useCheckout";

export default function CheckoutForm() {
    const { mutate: checkout, isPending } = useCheckout();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        checkout({
            amount: 1000,
            currency: 'usd'
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <button type="submit" disabled={isPending}>
                {isPending ? 'Processing...' : 'Checkout'}
            </button>
        </form>
    );
}
