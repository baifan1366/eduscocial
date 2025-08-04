'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useCreateInvoice = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputData) => {
      // Generate invoice data with required fields
      const invoiceData = {
        orderId: inputData.orderId,
        invoiceNumber: `INV-${Date.now()}-${inputData.orderId?.slice(-8) || 'UNKNOWN'}`,
        businessName: inputData.businessName || 'EduSocial Business',
        businessTaxId: inputData.businessTaxId || '',
        billingAddress: inputData.billingAddress || '',
        pdfUrl: inputData.pdfUrl || '',
        issuedAt: inputData.issuedAt || new Date().toISOString(),
        ...inputData // Allow overriding any of the above
      };

      return invoicesApi.create({ data: invoiceData });
    },

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },

    onError: (error, variables, context) => {
      console.error('Invoice creation failed:', error);
      if (options.onError) {
        options.onError(error, variables, context);
      }
    },

    ...options
  });
};

export default useCreateInvoice;