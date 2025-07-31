import { useQuery } from '@tanstack/react-query';
import { categoryApi, boardCategoryMappingApi } from '@/lib/api';
import queryKeys from '@/lib/queryKeys';

/**
 * 用于获取分类列表的钩子
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
export default function useGetCategories(options = {}) {
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
    queryKey: queryKeys.categories.list(queryParams),
    queryFn: async () => {
      try {
        const categoriesResult = await categoryApi.getAll(queryParams);
        
        if (!includeCategoryData) {
          return categoriesResult;
        }

        const categories = categoriesResult.categories || [];

        const batchSize = 10;
        const categoryGroups = [];
        for (let i = 0; i < categories.length; i += batchSize) {
          categoryGroups.push(categories.slice(i, i + batchSize));
        }

        for (const group of categoryGroups) {
          await Promise.all(
            group.map(async (category) => {
              try {
                if (category.id) {
                  // 修改：确保与useGetBoards.js中的处理方式一致
                  // 传入null作为第一个参数(boardId)，category.id作为第二个参数(categoryId)
                  const boardsResult = await boardCategoryMappingApi.getAll(null, category.id);
                  if (boardsResult && boardsResult.boards) {
                    category.boards = boardsResult.boards;
                  } else {
                    category.boards = [];
                  }
                } else {
                  category.boards = [];
                }
              } catch (error) {
                console.error(`get category ${category.id} boards error:`, error);
                category.boards = [];
              }
            })
          );
        }

        return categoriesResult;
      } catch (error) {
        console.error('error:', error);
        throw error;
      }
    },
    enabled,
    placeholderData: (previousData) => previousData, // replaces keepPreviousData
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
} 