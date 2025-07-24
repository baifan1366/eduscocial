import { useQuery } from '@tanstack/react-query';
import { boardsApi, boardCategoryMappingApi } from '@/lib/api';

/**
 * 用于获取面板列表的钩子
 * @param {Object} options - 查询选项
 * @param {boolean} options.enabled - 是否启用查询
 * @param {Object} options.filters - 过滤条件
 * @param {string} options.orderBy - 排序字段
 * @param {string} options.orderDirection - 排序方向 ('asc' 或 'desc')
 * @param {number} options.limit - 限制返回的记录数
 * @param {number} options.offset - 查询偏移量
 * @param {boolean} options.includeCategoryData - 是否包含分类数据
 * @returns {Object} 查询结果
 */
export default function useGetBoards(options = {}) {
  const { 
    enabled = true, 
    filters = {}, 
    orderBy = 'name', 
    orderDirection = 'asc',
    limit = 100,
    offset = 0,
    includeCategoryData = false
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
    queryKey: ['boards', orderBy, orderDirection, limit, offset, filters, includeCategoryData],
    queryFn: async () => {
      try {
        // 获取boards数据
        const boardsResult = await boardsApi.getAll(queryParams);
        
        // 如果不需要分类数据，直接返回
        if (!includeCategoryData) {
          return boardsResult;
        }
        
        // 如果需要分类数据，为每组board获取它的分类
        const boards = boardsResult.boards || [];
        
        // 将boards按每10个一组进行分组
        const batchSize = 10;
        const boardGroups = [];
        for (let i = 0; i < boards.length; i += batchSize) {
          boardGroups.push(boards.slice(i, i + batchSize));
        }
        
        // 按组获取分类数据
        for (const group of boardGroups) {
          // 为当前组的每个board并行获取分类数据
          await Promise.all(
            group.map(async (board) => {
              try {
                if (board.id) {
                  const categoryResult = await boardCategoryMappingApi.getAll(board.id);
                  // 将分类数据添加到board对象中
                  if (categoryResult && categoryResult.categories) {
                    board.categories = categoryResult.categories;
                  } else {
                    board.categories = [];
                  }
                }
              } catch (error) {
                console.error(`get board ${board.id} category error:`, error);
                board.categories = [];
              }
            })
          );
        }
        
        return boardsResult;
      } catch (error) {
        console.error('get boards error:', error);
        throw error;
      }
    },
    enabled,
    placeholderData: (previousData) => previousData, // replaces keepPreviousData
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
} 