'use client';

import { useQuery } from '@tanstack/react-query';
import { boardsApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

const useGetBoardByBoardId = (boardId, options = {}) => {
    return useQuery({
        queryKey: queryKeys.boards.byId(boardId),
        queryFn: () => boardsApi.getBoardByBoardId(boardId),
        ...options
    });
};

export default useGetBoardByBoardId;