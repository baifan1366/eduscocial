import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

export default function useGetInvoices(options = {}) {
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
    queryKey: queryKeys.invoices.list(queryParams),
    queryFn: async () => {
      const result = await invoicesApi.getAll(queryParams);
      return result.invoices;
    },
    enabled,
    placeholderData: (previousData) => previousData, // replaces keepPreviousData
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
} 