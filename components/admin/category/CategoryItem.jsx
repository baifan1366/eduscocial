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

    const hasChildren = category.children && category.children.length > 0

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
        
        if (!onDelete) return
        
        try {
            const confirmed = await confirmAsync({
                title: t('deleteCategoryConfirmTitle'),
                variant: "error",
                description: t('deleteCategoryConfirmDescription', {name: category.name})
            })
            
            if (confirmed) {
                // 只在确认后调用父组件的onDelete
                onDelete(category.id)
            }
        } catch (error) {
            console.error('确认对话框出错:', error)
        }
    }

    // 递归更新类别及其所有子类别的激活状态
    const updateCategoryAndChildrenStatus = (categoryObj, isActive) => {
        // 更新当前类别
        updateCategoryActiveStatus({ 
            categoryId: categoryObj.id, 
            data: { is_active: isActive } 
        });
        
        // 如果有子类别，递归更新所有子类别
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
            // 获取parentId，这里假设category对象中有parentId字段
            const parentId = categoryObj.parent_id;
            
            // 如果存在父类别，检查父类别是否激活
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
                        return; // 不执行激活操作
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
                        <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            
                {hasChildren && (
                    <AccordionContent>
                        <div className="pl-6 border-l-2 border-l-muted ml-4">
                            {renderChildren(category.children, depth + 1)}
                        </div>
                    </AccordionContent>
                )}
            </AccordionItem>
        </div>
    )
} 