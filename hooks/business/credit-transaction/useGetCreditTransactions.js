import { useQuery } from '@tanstack/react-query';
import { creditTransactionsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

export default function useGetCreditTransactions(options = {}) {
  const { 
    enabled = true, 
    filters = {}, 
    orderBy = 'created_at', 
    orderDirection = 'desc',
    limit = 100,
    offset = 0,
  } = options;

  // 构建查询参数
  const queryParams = {
    orderBy,
    orderDirection,
    limit,
    offset,
    ...filters
  };

  return useQuery({
    queryKey: queryKeys.creditTransactions.list(queryParams),
    queryFn: async () => {
      const result = await creditTransactionsApi.getAll(queryParams);
      return result.credit_transactions;
    },
    enabled,
    placeholderData: (previousData) => previousData, // replaces keepPreviousData
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
} 