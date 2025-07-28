'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import useGetCategories from '@/hooks/admin/category/useGetCategories'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Accordion } from '@/components/ui/accordion'
import { Plus, Search, X } from 'lucide-react'
import CategoryItem from './CategoryItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CreateCategoryDialog from './CreateCategoryDialog'
import CreateSubCategoryDialog from './CreateSubCategoryDialog'
import EditCategoryDialog from './EditCategoryDialog'
import useDeleteCategory from '@/hooks/admin/category/useDeleteCategory'
import { toast } from 'sonner'

export default function DisplayAllCategories() {
    const t = useTranslations('Category')
    const { data, isLoading, error, refetch } = useGetCategories({
        includeCategoryData: true
    })
    const [activeId, setActiveId] = useState(null)
    const [expandedCategories, setExpandedCategories] = useState([])
    const [search, setSearch] = useState('')
    
    // 创建引用来存储对话框组件的实例
    const createDialogRef = useRef(null)
    const createSubDialogRef = useRef(null)
    const editDialogRef = useRef(null)
    
    const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory({
        onSuccess: () => {
            toast.success(t('category_deleted'))
            refetch()
        },
        onError: (error) => {
            toast.error(t('error_deleting_category'))
            console.error('删除分类失败:', error)
        }
    })

    // 搜索处理函数
    const handleSearch = (value) => {
        setSearch(value)
        // 当搜索时自动展开所有分类以便查看结果
        if (value && data?.categories) {
            const categoryIds = data.categories.map(c => c.id)
            setExpandedCategories(categoryIds)
        } else {
            setExpandedCategories([])
        }
    }

    // 搜索过滤函数
    const filterCategories = (categories, searchTerm) => {
        if (!searchTerm) return categories

        return categories.filter(category => {
            const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
            
            // 检查板块是否匹配搜索词
            const hasMatchingBoards = category.boards && category.boards.some(board => 
                board.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            
            // 如果当前类别或其板块匹配，则保留整个类别
            if (matchesSearch || hasMatchingBoards) return true
            
            // 如果当前类别不匹配，检查其子类别是否匹配
            if (category.children && category.children.length > 0) {
                const filteredChildren = filterCategories(category.children, searchTerm)
                
                // 如果有匹配的子类别，则更新该类别的子类别并保留该类别
                if (filteredChildren.length > 0) {
                    category.children = filteredChildren
                    return true
                }
            }
            
            return false
        })
    }

    // Convert flat category list to hierarchical structure
    const categoryTree = useMemo(() => {
        if (!data?.categories) return []
        
        const categoryMap = {}
        
        // 首先，创建所有分类对象的副本，保留boards数据
        data.categories.forEach(category => {
            categoryMap[category.id] = { 
                ...category, 
                children: [],
                boards: category.boards || [] // 确保保留boards数据
            }
        })
        
        const rootCategories = []
        data.categories.forEach(category => {
            if (category.parent_id) {
                if (categoryMap[category.parent_id]) {
                    categoryMap[category.parent_id].children.push(categoryMap[category.id])
                }
            } else {
                rootCategories.push(categoryMap[category.id])
            }
        })
        
        // 应用搜索过滤
        return filterCategories(rootCategories, search)
    }, [data, search])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event) => {
        setActiveId(null)
        const { active, over } = event
    }

    const toggleExpand = useCallback((categoryId) => {
        setExpandedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId)
            } else {
                return [...prev, categoryId]
            }
        })
    }, [])

    // 创建顶级分类
    const handleAddCategory = () => {
        if (createDialogRef.current) {
            createDialogRef.current.openWithParent(null)
        }
    }
    
    // 创建子分类
    const handleAddSubCategory = (parentId, parentName) => {
        if (createSubDialogRef.current) {
            createSubDialogRef.current.openWithParent(parentId, parentName)
        }
    }
    
    const handleEditCategory = (category) => {
        if (editDialogRef.current) {
            editDialogRef.current.open(category)
        }
    }
    
    // 直接执行删除操作，确认逻辑已经移到CategoryItem中
    const handleDeleteCategory = (categoryId) => {
        deleteCategory(categoryId)
    }

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (error) {
        return <div className="p-4 text-red-500">{t('error_loading')}</div>
    }

    const renderCategories = (categories, depth = 0) => {
        return categories.map(category => (
            <CategoryItem
                key={category.id}
                category={category}
                depth={depth}
                onToggleExpand={toggleExpand}
                isExpanded={expandedCategories.includes(category.id)}
                onAddCategory={handleAddSubCategory}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                renderChildren={renderCategories}
                allCategories={data?.categories || []}
            />
        ))
    }

    return (
        <div className="space-y-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('categories')}</h2>
                <div className='flex items-center gap-2 w-1/3'>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                            type='text' 
                            placeholder={t('searchPlaceholder')} 
                            onChange={(e) => handleSearch(e.target.value)} 
                            value={search}
                            className="pl-10" 
                        />
                        {search && (
                            <X 
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700" 
                                onClick={() => handleSearch('')}
                            />
                        )}
                    </div>
                </div>
                <Button variant="orange" onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add_category')}
                </Button>
            </div>
            
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <Accordion 
                    type="multiple" 
                    value={expandedCategories}
                    className="border rounded-md bg-card"
                >
                    <SortableContext 
                        items={data?.categories?.map(c => c.id) || []}
                        strategy={verticalListSortingStrategy}
                    >
                        {categoryTree.length > 0 ? (
                            renderCategories(categoryTree)
                        ) : (
                            <div className="p-4 text-center text-muted-foreground">
                                {search ? t('no_search_results') : t('no_categories')}
                            </div>
                        )}
                    </SortableContext>
                </Accordion>
            </DndContext>
            
            {/* 隐藏的对话框组件 */}
            <div className="hidden">
                <CreateCategoryDialog 
                    ref={createDialogRef}
                    onClick={refetch}
                />

                <CreateSubCategoryDialog 
                    ref={createSubDialogRef}
                    onClick={refetch}
                />
                
                <EditCategoryDialog 
                    ref={editDialogRef}
                    onSuccess={refetch}
                />
            </div>
        </div>
    )
}