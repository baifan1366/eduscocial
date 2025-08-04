import { useQuery } from '@tanstack/react-query';
import { businessCreditsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

export default function useGetCredits() {
  return useQuery({
    queryKey: queryKeys.businessCredits.list(),
    queryFn: async () => {
      const result = await businessCreditsApi.getAll();
      return result.credits;
    }
  });
} 