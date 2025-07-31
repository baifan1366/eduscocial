'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useUpdateBoardActiveStatus = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ boardId, data }) => boardsApi.updateBoardActiveStatus(boardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
        },
    });
};

export default useUpdateBoardActiveStatus;