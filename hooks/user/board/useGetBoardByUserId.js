'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useGetBoardByUserId = (userId) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: queryKeys.boards.byUserId(userId),
        queryFn: () => boardsApi.getBoardByUserId(userId),
        enabled: !!userId,
    });
};

export default useGetBoardByUserId;