'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useCheckout = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: paymentsApi.checkout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.payments.checkout() });
        }
    });
}

export default useCheckout;