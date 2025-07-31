'use client'

import { FolderIcon, Plus, Pen, Trash2, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useConfirm } from '@/hooks/useConfirm'
import { useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import useUpdateCategoryActiveStatus from '@/hooks/admin/category/useUpdateCategoryActiveStatus'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import useGetBoardByBoardId from '@/hooks/admin/board/useGetBoardByBoardId'

// 一个辅助函数，安全地获取BoardId字符串
const getSafeBoardId = (boardId) => {
    if (boardId === undefined || boardId === null) return null;
    
    // 如果是字符串直接返回
    if (typeof boardId === 'string') return boardId;
    
    // 如果是对象
    if (typeof boardId === 'object' && boardId !== null) {
        if (boardId.id) return String(boardId.id);
        if (boardId.boardId) return String(boardId.boardId);
        if (boardId.board_id) return String(boardId.board_id);
        if (boardId._id) return String(boardId._id);
        
        // 尝试获取第一个值
        const firstValue = Object.values(boardId)[0];
        return firstValue ? String(firstValue) : null;
    }
    
    // 其他情况，如果是数字等，转为字符串
    return String(boardId);
};

export default function CategoryItem({ 
    category, 
    depth = 0, 
    onToggleExpand,
    isExpanded,
    onAddCategory,
    onEdit,
    onDelete,
    renderChildren,
    allCategories 
}) {
    const t = useTranslations('Category')
    const { confirmAsync } = useConfirm()
    const { mutate: updateCategoryActiveStatus } = useUpdateCategoryActiveStatus()

    // 定义状态变量
    const hasChildren = (category.children && category.children.length > 0) || 
                       (category.boards && category.boards.length > 0) || 
                       (category.subcategories && category.subcategories.length > 0)
    const hasSubCategories = category.children && category.children.length > 0
    const hasBoards = category.boards && category.boards.length > 0
    const hasSubcategoriesList = category.subcategories && category.subcategories.length > 0

    // 提取boardIds - 为了确定需要获取哪些board的详细信息
    const boardIds = useMemo(() => {
        if (!category.boards || !Array.isArray(category.boards)) return [];
        
        return category.boards.map(board => {
            // 如果board本身就是字符串，直接返回
            if (typeof board === 'string') return board;
            
            // 如果是对象，尝试获取id或board_id
            if (typeof board === 'object' && board !== null) {
                if (board.id) return board.id;
                if (board.boardId) return board.boardId;
                if (board.board_id) return board.board_id;
                
                // 检查是否有_id字段（MongoDB常用格式）
                if (board._id) return board._id;
                
                // 最后尝试从对象获取第一个值
                const firstValue = Object.values(board)[0];
                return firstValue ? String(firstValue) : `board-${Math.random()}`;
            }
            
            // 其他情况返回字符串化的值
            return String(board);
        });
    }, [category.boards]);

    // 只有当类别展开且有boards时才获取board详细信息
    const shouldFetchBoards = isExpanded && hasBoards && boardIds && boardIds.length > 0;
    
    // 安全地获取board ID
    const boardId1 = shouldFetchBoards ? getSafeBoardId(boardIds[0]) : null;
    const boardId2 = shouldFetchBoards ? getSafeBoardId(boardIds[1]) : null;
    const boardId3 = shouldFetchBoards ? getSafeBoardId(boardIds[2]) : null;
    const boardId4 = shouldFetchBoards ? getSafeBoardId(boardIds[3]) : null;
    const boardId5 = shouldFetchBoards ? getSafeBoardId(boardIds[4]) : null;
    
    // 按照React Hooks规则，确保Hook调用是无条件的
    const board1Query = useGetBoardByBoardId(boardId1, { 
        enabled: !!boardId1 && shouldFetchBoards,
        staleTime: 60000 // 增加staleTime，减少重复请求
    });
    const board2Query = useGetBoardByBoardId(boardId2, { 
        enabled: !!boardId2 && shouldFetchBoards,
        staleTime: 60000
    });
    const board3Query = useGetBoardByBoardId(boardId3, { 
        enabled: !!boardId3 && shouldFetchBoards,
        staleTime: 60000
    });
    const board4Query = useGetBoardByBoardId(boardId4, { 
        enabled: !!boardId4 && shouldFetchBoards,
        staleTime: 60000
    });
    const board5Query = useGetBoardByBoardId(boardId5, { 
        enabled: !!boardId5 && shouldFetchBoards,
        staleTime: 60000
    });

    // 将获取的board数据整合到一个对象中
    const boardsData = useMemo(() => {
        if (!shouldFetchBoards) return {};
        
        const result = {};
        if (boardId1) result[boardId1] = board1Query;
        if (boardId2) result[boardId2] = board2Query;
        if (boardId3) result[boardId3] = board3Query;
        if (boardId4) result[boardId4] = board4Query;
        if (boardId5) result[boardId5] = board5Query;
        
        return result;
    }, [shouldFetchBoards, boardId1, boardId2, boardId3, boardId4, boardId5, board1Query, board2Query, board3Query, board4Query, board5Query, boardIds]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    }

    const handleAddClick = (e) => {
        e.stopPropagation()
        onAddCategory(category.id, category.name)
    }

    const handleEditClick = (e) => {
        e.stopPropagation()
        onEdit && onEdit(category)
    }

    const handleDeleteClick = async (e) => {
        e.stopPropagation()
        
        if (!onDelete || hasChildren) return
        
        try {
            const confirmed = await confirmAsync({
                title: t('deleteCategoryConfirmTitle'),
                variant: "error",
                description: t('deleteCategoryConfirmDescription', {name: category.name})
            })
            
            if (confirmed) {
                onDelete(category.id)
            }
        } catch (error) {
            console.error('确认对话框出错:', error)
        }
    }

    // 递归更新类别及其所有子类别的激活状态
    const updateCategoryAndChildrenStatus = (categoryObj, isActive) => {
        updateCategoryActiveStatus({ 
            categoryId: categoryObj.id, 
            data: { is_active: isActive } 
        });
        
        if (categoryObj.children && categoryObj.children.length > 0) {
            categoryObj.children.forEach(child => {
                updateCategoryAndChildrenStatus(child, isActive);
            });
        }
    };

    // 帮助函数：根据ID查找类别
    const findCategoryById = (categoryId) => {
        const findInCategories = (categories, id) => {
            if (!categories) return null;
            
            for (const cat of categories) {
                if (cat.id === id) return cat;
                
                if (cat.children && cat.children.length > 0) {
                    const found = findInCategories(cat.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return findInCategories(allCategories, categoryId);
    };

    const toggleActive = async (categoryObj, isActive) => {
        // 如果是激活操作，需要检查父类别状态
        if (isActive) {
            const parentId = categoryObj.parent_id;
            
            if (parentId) {
                try {
                    const parentCategory = findCategoryById(parentId);
                    
                    if (parentCategory && !parentCategory.is_active) {
                        await confirmAsync({
                            title: t('activateChildCategoryWarningTitle', {fallback: t('activateChildCategoryWarningTitleFallback')}),
                            variant: "warning",
                            description: t('activateChildCategoryWarningDescription', {
                                name: categoryObj.name,
                                parentName: parentCategory.name,
                                fallback: t('activateChildCategoryWarningDescriptionFallback', {
                                    name: categoryObj.name,
                                    parentName: parentCategory.name
                                })
                            })
                        });
                        return;
                    }
                } catch (error) {
                    console.error('check parent category status error:', error);
                }
            }
        }
        
        // 如果是取消激活状态，显示确认对话框
        if (!isActive) {
            try {
                const confirmed = await confirmAsync({
                    title: t('deactiveCategoryConfirmTitle', {fallback: t('deactiveCategoryConfirmTitleFallback')}),
                    variant: "warning",
                    description: t('deactiveCategoryConfirmDescription', {
                        name: categoryObj.name,
                        fallback: t('deactiveCategoryConfirmDescriptionFallback', {
                            name: categoryObj.name,
                        })
                    })
                });
                
                if (!confirmed) return;
            } catch (error) {
                console.error('confirm dialog error:', error);
                return;
            }
        }
        
        // 更新当前类别及其所有子类别
        updateCategoryAndChildrenStatus(categoryObj, isActive);
    }
    
    // 渲染子类别
    const renderChildrenWithKey = (children) => {
        if (!children || !Array.isArray(children) || children.length === 0) return null;
        
        try {
            return children.map((child) => (
                <div key={child.id || `child-${child.name || 'unknown'}-${Math.random()}`}>
                    {renderChildren([child], depth + 1)}
                </div>
            ));
        } catch (error) {
            console.error("Error in renderChildrenWithKey:", error);
            return null;
        }
    };

    // 渲染版块
    const renderBoards = () => {
        if (!hasBoards || !isExpanded || !boardIds || boardIds.length === 0) return null;
        
        try {            
            return (
                <div className="pl-6 border-l-2 border-l-muted/50 ml-4 mt-2">
                    {boardIds.map((boardId, index) => {
                        // 确保获得完整的ID字符串
                        const safeId = String(boardId);
                        
                        // 如果超出了我们可以获取的board数量
                        if (index > 4) {
                            return (
                                <div key={`board-${safeId}-limited`} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/30">
                                    <div className="h-5 w-5 bg-gray-100 rounded-md flex items-center justify-center">
                                        <Icon icon="mdi:help-circle" className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">board #{safeId.substring(0, 8)}...</span>
                                </div>
                            );
                        }
                        
                        // 获取当前boardId对应的数据
                        const boardData = boardsData[safeId];
                        
                        // 如果没有数据或者正在加载
                        if (!boardData || boardData.isLoading) {
                            return (
                                <div key={`board-${safeId}-loading`} className="flex items-center gap-2 py-2 px-2 rounded-md">
                                    <Skeleton className="h-5 w-5 rounded-md" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            );
                        }
                        
                        // 如果加载出错
                        if (boardData.error) {
                            return (
                                <div key={`board-${safeId}-error`} className="flex items-center gap-2 py-2 px-2 rounded-md">
                                    <div className="h-5 w-5 bg-red-100 rounded-md flex items-center justify-center">
                                        <Icon icon="mdi:alert-circle" className="h-4 w-4 text-red-500" />
                                    </div>
                                    <span className="text-sm text-red-500">error</span>
                                </div>
                            );
                        }
                        
                        // 成功获取数据 - 尝试多种可能的数据路径
                        // 查看boardData的结构，尝试找到正确的board数据位置
                        let board = null;
                        if (boardData.data?.data) {
                            // 标准路径: boardData.data.data
                            board = boardData.data.data;
                        } else if (boardData.data) {
                            // 替代路径: boardData.data
                            board = boardData.data;
                        } else if (boardData.board) {
                            // 直接board属性
                            board = boardData.board;
                        }                    
                        
                        if (!board) {
                            return (
                                <div key={`board-${safeId}-notfound`} className="flex items-center gap-2 py-2 px-2 rounded-md">
                                    <div className="h-5 w-5 bg-gray-100 rounded-md flex items-center justify-center">
                                        <Icon icon="mdi:help-circle" className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <span className="text-sm text-gray-500">board #{safeId} (数据缺失)</span>
                                </div>
                            );
                        }
                        
                        // 正常显示board
                        return (
                            <div key={`board-${safeId}-loaded`} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/30">
                                <div className="flex items-center justify-center h-5 w-5 rounded-md bg-transparent">
                                    <Icon 
                                        icon={board.icon || 'mdi:help-circle'}
                                        style={{ color: board.color || '#888888' }}
                                        className="h-4 w-4 text-muted-foreground" 
                                    />
                                </div>
                                <span className="text-sm text-muted-foreground">{board.name || 'Unnamed Board'}</span>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (error) {
            console.error("Error in renderBoards:", error);
            return null;
        }
    };

    // 渲染子分类
    const renderSubcategories = () => {
        if (!hasSubcategoriesList || !Array.isArray(category.subcategories)) return null;
        
        try {
            return (
                <div className="pl-6 border-l-2 border-l-muted/50 ml-4 mt-2">
                    {category.subcategories.map(subcategory => (
                        <div key={subcategory.id || `subcategory-${subcategory.name || 'unknown'}-${Math.random()}`} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/30">
                            <div className="flex items-center justify-center h-5 w-5 rounded-md bg-transparent">
                                <Icon 
                                    icon={subcategory.icon || 'mdi:folder'}
                                    style={{ color: subcategory.color || '#888888' }}
                                    className="h-4 w-4 text-muted-foreground" 
                                />
                            </div>
                            <span className="text-sm text-muted-foreground">{subcategory.name || 'Unnamed Subcategory'}</span>
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            console.error("Error in renderSubcategories:", error);
            return null;
        }
    };
    
    return (
        <div ref={setNodeRef} style={style} className="category-item">
            <AccordionItem value={category.id} className="border-0">
                <div className="flex items-center gap-2 pl-1 pr-2 rounded-md hover:bg-muted/50">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="p-1 h-8 w-8 cursor-grab active:cursor-grabbing"
                        {...attributes} 
                        {...listeners}
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    
                    <AccordionTrigger 
                        className={`py-2 ${hasChildren ? '' : 'cursor-default hover:no-underline'}`}
                        onClick={() => hasChildren && onToggleExpand(category.id)}
                        disabled={!hasChildren}
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-transparent">
                                <Icon 
                                    icon={category.icon}
                                    className="h-4 w-4" 
                                    style={{ color: category.color || '#888888' }} 
                                />
                            </div>
                            <span className="font-medium text-white">{category.name}</span>
                            {category.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-60">
                                    {category.description}
                                </span>
                            )}
                        </div>
                    </AccordionTrigger>
                
                    <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Switch 
                            checked={category.is_active}
                            onCheckedChange={() => toggleActive(category, !category.is_active)}                            
                        />
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleAddClick}
                            className="h-8 w-8 text-white"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={handleEditClick}
                        >
                            <Pen className="h-4 w-4" />
                        </Button>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className={`h-8 w-8 ${hasChildren ? 'text-red-500/50' : 'text-red-500 hover:text-red-600'}`}
                                            onClick={handleDeleteClick}
                                            disabled={hasChildren}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {hasChildren && (
                                    <TooltipContent>
                                        <p>{t('cannotDeleteCategoryWithChildren', {fallback: t('cannotDeleteCategoryWithChildrenFallback', {name: category.name})})}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            
                {(hasSubCategories || hasBoards || hasSubcategoriesList) && (
                    <AccordionContent>
                        {hasSubCategories && (
                            <div className="pl-6 border-l-2 border-l-muted ml-4">
                                {renderChildrenWithKey(category.children)}
                            </div>
                        )}
                        {hasSubcategoriesList && renderSubcategories()}
                        {hasBoards && renderBoards()}
                    </AccordionContent>
                )}
            </AccordionItem>
        </div>
    )
} 