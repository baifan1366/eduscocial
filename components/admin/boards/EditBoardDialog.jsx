'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@iconify/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import useEditBoard from '@/hooks/admin/board/useEditBoard'
import useGetBoardByBoardId from '@/hooks/admin/board/useGetBoardByBoardId'
import useCheckBoardExists from '@/hooks/admin/board/useCheckBoardExists'
import useGetAllCategoryByBoardId from '@/hooks/admin/board-category/useGetAllCategoryByBoardId'
import { z } from 'zod'
import { useState, useEffect, useMemo } from 'react'
import { SketchPicker } from 'react-color'
import PreviewBoard from './PreviewBoard'
import { toast } from 'sonner'
import { debounce } from 'lodash'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, Folder, FolderOpen, ChevronDown } from 'lucide-react'
import useGetCategories from '@/hooks/admin/category/useGetCategories'
import useMatchBoardWithCategory from '@/hooks/admin/board-category/useMatchBoardWithCategory'

export default function EditBoardDialog({ boardId, children }) {
    const t = useTranslations('Board')
    const [openDialog, setOpenDialog] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [boardNameToCheck, setBoardNameToCheck] = useState('')
    const [isInitialLoading, setIsInitialLoading] = useState(true) // 添加加载状态
    const [searchCategory, setSearchCategory] = useState('')
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
    const [boardCategories, setBoardCategories] = useState([])
    
    //get board data
    const { data: board, isLoading: isLoadingBoard, refetch } = useGetBoardByBoardId(boardId, {
        enabled: openDialog, // 只在对话框打开时获取数据
    })

    // 获取当前板块的分类数据
    const { data: boardCategoriesData, refetch: refetchBoardCategories, isLoading: isBoardCategoriesLoading } = useGetAllCategoryByBoardId(boardId, {
        enabled: openDialog, // 只在对话框打开时获取数据
    })

    // 使用useGetCategories获取所有分类
    const { data: allCategoriesData } = useGetCategories()
    const categories = allCategoriesData?.categories || []
    
    // 使用updateBoardCategories更新板块分类关联
    const { mutate: updateBoardCategories } = useMatchBoardWithCategory()

    // 当对话框打开时，获取板块数据和分类数据
    useEffect(() => {
        if (openDialog && boardId) {
            setIsInitialLoading(true) // 开始加载
            Promise.all([refetch(), refetchBoardCategories()]).then(() => {
                setTimeout(() => setIsInitialLoading(false), 200) // 加载完成后设置标志
            })
        }
    }, [openDialog, boardId, refetch, refetchBoardCategories])

    // 当板块分类数据加载完成时，更新状态
    useEffect(() => {
        if (boardCategoriesData?.categories?.length > 0) {
            const categoryIds = boardCategoriesData.categories.map(cat => cat.category_id)
            setBoardCategories(categoryIds)
        } else {
            setBoardCategories([])
        }
    }, [boardCategoriesData])
    
    // 将分类按照父子级结构进行组织
    const organizedCategories = useMemo(() => {
        // 创建分类映射
        const categoryMap = categories.reduce((acc, category) => {
            acc[category.id] = { ...category, children: [] }
            return acc
        }, {})
        
        // 构建树结构
        const rootCategories = []
        categories.forEach(category => {
            if (category.parent_id) {
                if (categoryMap[category.parent_id]) {
                    categoryMap[category.parent_id].children.push(categoryMap[category.id])
                }
            } else {
                rootCategories.push(categoryMap[category.id])
            }
        })
        
        return rootCategories
    }, [categories])
    
    // 过滤分类列表基于搜索词
    const filteredCategories = useMemo(() => {
        if (!searchCategory) return categories
        
        return categories.filter(category => 
            category.name.toLowerCase().includes(searchCategory.toLowerCase())
        )
    }, [categories, searchCategory])
    
    // 递归渲染分类项
    const renderCategoryItems = (categories, level = 0) => {
        return categories.map(category => (
            <div key={category.id}>
                <CommandItem
                    value={`category-${category.id}`}
                    onSelect={() => toggleCategory(category.id)}
                    className={`pl-${level * 4 + 2} flex items-center gap-2`}
                >
                    <Icon icon={category.icon} style={{color: category.color}} className="h-4 w-4" />
                    <span>{category.name}</span>
                    {boardCategories.includes(category.id) && (
                        <Check className="h-4 w-4 ml-auto" />
                    )}
                </CommandItem>
                {category.children?.length > 0 && renderCategoryItems(category.children, level + 1)}
            </div>
        ));
    }
    
    // 处理分类选择
    const toggleCategory = async (categoryId) => {
        // 检查分类是否已经被选择
        const isSelected = boardCategories.includes(categoryId)
        
        // 更新选择状态
        const updatedCategories = isSelected 
            ? boardCategories.filter(id => id !== categoryId)
            : [...boardCategories, categoryId]
            
        setBoardCategories(updatedCategories)
        
        // 调用API更新分类关联
        try {
            await updateBoardCategories({
                data: {
                    boardId,
                    selectedCategoryIds: updatedCategories
                }
            })
        } catch (error) {
            console.error('Failed to update board categories:', error)
        }
    }
    
    // 格式化显示已选分类
    const formatSelectedCategories = () => {
        if (boardCategories.length === 0) {
            return t('noCategory')
        }
        
        const selectedCategoryNames = boardCategories
            .map(id => categories.find(cat => cat.id === id)?.name || '')
            .filter(Boolean)
        
        return selectedCategoryNames.length > 2 
            ? `${selectedCategoryNames.slice(0, 2).join(', ')} +${selectedCategoryNames.length - 2}`
            : selectedCategoryNames.join(', ')
    }

    //edit board data
    const { mutate: editBoard, isPending } = useEditBoard({
        onSuccess: () => {
            toast.success(t('boardUpdatedSuccessfully'))
            setOpenDialog(false)
        },
        onError: (error) => {
            console.error("Edit board error:", error);
            if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
                toast.error(t('boardAlreadyExists'))
                form.setError('boardName', {
                    type: 'manual',
                    message: t('boardAlreadyExists')
                })
            } else {
                toast.error(t('boardUpdateFailed'))
            }
        }
    })
    
    // 使用自定义钩子检查板块名称是否存在
    const { data: boardExistsData, isLoading: isCheckingBoardName } = useCheckBoardExists({
        boardName: boardNameToCheck,
        boardId: boardId, // 排除当前编辑的板块
        enabled: !!boardNameToCheck && boardNameToCheck.length > 0
    })

    // debounce函数，延迟检查板块名称
    const debouncedCheckBoardName = debounce((name) => {
        if (name && name.trim().length > 0) {
            setBoardNameToCheck(name.trim())
        }
    }, 500)

    //set slug url bsed on board name
    //replace the empty space to -
    //make it lowercase
    //make it 20 characters max
    //update on typing
    const setSlug = (boardName) => {
        return boardName.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 20)
    }

    const allIcons = [
    'mdi:account', 'mdi:school', 'mdi:food', 'mdi:gamepad-variant', 'mdi:music', 'mdi:movie-open', 
    'mdi:palette', 'mdi:briefcase-outline', 'mdi:robot-outline', 'mdi:book-open-page-variant', 'mdi:leaf', 'mdi:dog', 
    'mdi:airplane', 'mdi:basketball', 'mdi:comment-question-outline', 'mdi:hand-heart', 'mdi:star-outline', 'mdi:emoji-happy', 
    'mdi:compass-outline', 'mdi:alarm'
    ]

    //form
    const form = useForm({
        resolver: zodResolver(z.object({
            boardName: z.string({
                required_error: t('boardNameRequired'),
                invalid_type_error: t('boardNameInvalidType'),
            }).min(1, {message: t('boardNameRequired')}).max(20, {message: t('boardNameMaxLength')}),
            slug: z.string({ //only lowercase and dash accepted
                required_error: t('slugRequired'),
                invalid_type_error: t('slugInvalidType'),
                pattern: /^[a-z0-9-]+$/,
                message: t('slugInvalidFormat'),
            }).min(1, {message: t('slugRequired')}).max(20, {message: t('slugMaxLength')}),
            description: z.string({
                required_error: t('descriptionRequired'),
                invalid_type_error: t('descriptionInvalidType'),
            }).max(100, {message: t('descriptionMaxLength')}),
            color: z.string({
                required_error: t('colorRequired'),
                invalid_type_error: t('colorInvalidType'),
            }).max(20, {message: t('colorMaxLength')}),
            categoryIcon: z.string({
                required_error: t('categoryIconRequired'),
                invalid_type_error: t('categoryIconInvalidType'),
            }).max(20, {message: t('categoryIconMaxLength')}),
            visibility: z.enum(['public', 'private'], {
                required_error: t('visibilityRequired'),
                invalid_type_error: t('visibilityInvalidType'),
            }),
            anonymousPost: z.boolean({
                required_error: t('anonymousPostRequired'),
                invalid_type_error: t('anonymousPostInvalidType'),
            }),
            status: z.enum(['approved', 'pending', 'rejected'], {
                required_error: t('statusRequired'),
                invalid_type_error: t('statusInvalidType'),
            }),
            is_active: z.boolean({
                required_error: t('activeStatusRequired'),
                invalid_type_error: t('activeStatusInvalidType'),
            })
        })),
        mode: 'onChange',
        defaultValues: {
            boardName: '',
            slug: '',
            description: '',
            color: '#000000',
            categoryIcon: 'mdi:emoji-happy',
            visibility: 'private',   
            anonymousPost: false,
            status: 'approved',
            is_active: true,
        },
    })

    // 当板块数据加载完成时，填充表单
    useEffect(() => {
        if (board) {
            console.log("Board data loaded:", board); // 调试用
            console.log("Status value:", board.status, "Type:", typeof board.status); // 查看status值和类型
            
            // 确保表单状态和API返回的一致
            const formValues = {
                boardName: board.name || '',
                slug: board.slug || '',
                description: board.description || '',
                color: board.color || '#000000',
                categoryIcon: board.icon || 'mdi:emoji-happy',
                visibility: board.visibility || 'private',
                anonymousPost: board.anonymous || false,
                status: board.status || 'approved',
                is_active: board.is_active !== undefined ? board.is_active : true,
            };
            
            console.log("Setting form values:", formValues);
            form.reset(formValues);
        }
    }, [board, form])

    const onSubmit = async (data) => {
        // 如果板块名称已存在且不是当前板块，阻止提交并显示错误
        if (boardExistsData?.exists) {
            form.setError('boardName', {
                type: 'manual',
                message: t('boardAlreadyExists')
            })
            return
        }
        
        editBoard({ boardId, data })
        //close form
        setOpenDialog(false)
    }

    return (
        <>
            {children ? (
                <div onClick={() => setOpenDialog(true)}>
                    {children}
                </div>
            ) : (
                <Button onClick={() => setOpenDialog(true)}>
                    {t('editButton')}
                </Button>
            )}
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>   
                <DialogContent className="text-muted-foreground overflow-y-auto space-y-4 min-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t('editBoard')}</DialogTitle>
                        <DialogDescription>{t('editBoardDescription')}</DialogDescription>
                    </DialogHeader>
                    
                    {(isLoadingBoard || isInitialLoading) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 第一行：name 和 slug */}
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-10 w-full" />
                                <div className="flex justify-end">
                                    <Skeleton className="h-4 w-10" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-10 w-full" />
                                <div className="flex justify-end">
                                    <Skeleton className="h-4 w-10" />
                                </div>
                            </div>
                            
                            {/* 第二行：color, icon, status, activeStatus 都在一行 */}
                            <div className="md:col-span-2">
                                <div className="flex flex-row items-end gap-4">
                                    {/* Color */}
                                    <div className="w-24 space-y-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>

                                    {/* Icon */}
                                    <div className="w-30 space-y-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    
                                    {/* Status */}
                                    <div className="flex-1 w-24 space-y-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    
                                    {/* Active Status */}
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* 第三行：description */}
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-24 w-full" />
                                <div className="flex justify-end">
                                    <Skeleton className="h-4 w-10" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            
                            {/* visibility */}
                            <div className="md:col-span-2">
                                <div className="flex items-start space-x-3">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                            
                            {/* anonymous post */}
                            <div className="md:col-span-2">
                                <div className="flex items-start space-x-3 mt-4">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                            
                            {/* 按钮区 */}
                            <div className="md:col-span-2 flex justify-between pt-4">
                                <Skeleton className="h-10 w-28" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-24" />
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Form {...form} className="space-y-4">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 第一行：name 和 slug */}
                                    <div>
                                    <FormField
                                        control={form.control}
                                        name="boardName"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('boardName')} <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                            <Input 
                                                id="boardName" 
                                                {...field}
                                                className="w-full"
                                                autoFocus
                                                placeholder={t('boardNamePlaceholder')}
                                                maxLength={20}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // 当输入板块名称时自动更新 slug
                                                    const newSlug = setSlug(e.target.value);
                                                    form.setValue('slug', newSlug);
                                                    // 检查板块名称是否存在
                                                    debouncedCheckBoardName(e.target.value);
                                                }}
                                            />
                                            </FormControl>
                                            <div className="flex justify-between mt-1">
                                                <FormMessage className="text-red-500 text-sm" />                  
                                                <span />
                                                <span className="text-muted-foreground text-sm">
                                                    {field.value?.trim().length || 0}/20
                                                </span>
                                            </div>
                                        </FormItem>
                                        )}
                                    />
                                    </div>

                                    <div>
                                        <FormField
                                            control={form.control}
                                            name="slug"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('slugOrUrl')} <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                <Input
                                                    id="slug"
                                                    {...field}
                                                    className="w-full"
                                                    placeholder={t('enterSlug')}
                                                    maxLength={20}
                                                    onChange={(e) => {
                                                        const newSlug = setSlug(e.target.value);
                                                        field.onChange(newSlug);
                                                    }} 
                                                />
                                                </FormControl>
                                                <div className="flex justify-between mt-1">
                                                    <FormMessage className="text-red-500 text-sm" />
                                                    <span />
                                                    <span className="text-muted-foreground text-sm">
                                                        {field.value?.trim().length || 0}/20
                                                    </span>
                                                </div>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                    {/* 第二行：color、icon、status、activeStatus都在同一行 */}
                                    <div className="md:col-span-2">
                                        <div className="flex flex-row items-end gap-4">
                                            {/* Color */}
                                            <div className="w-24">
                                                <FormField
                                                    control={form.control}
                                                    name="color"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('color')} <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl>
                                                            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" className="w-full flex justify-center" style={{
                                                                        backgroundColor: field.value,
                                                                    }}>
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0 border-none">
                                                                    <SketchPicker 
                                                                        color={field.value}
                                                                        onChange={(color) => {
                                                                            field.onChange(color.hex);
                                                                        }}
                                                                        onChangeComplete={(color) => {
                                                                            field.onChange(color.hex);
                                                                            setShowColorPicker(false);
                                                                        }}
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </FormControl>
                                                        <FormMessage className="text-red-500 text-sm mt-1" />
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Category Icon */}
                                            <div className="w-30">
                                                <FormField
                                                    control={form.control}
                                                    name="categoryIcon"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('categoryIcon')} <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full">
                                                                    {field.value && <Icon icon={field.value} className="text-xl mr-1" />}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent>
                                                            {allIcons.map((iconName) => (
                                                                <DropdownMenuItem key={iconName} onClick={() => field.onChange(iconName)}>
                                                                    <Icon icon={iconName} className="text-xl" />
                                                                    <span className="text-sm">{iconName.split(':')[1]}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>
                                            
                                            {/* Status Dropdown */}
                                            <div className="flex-1 w-24">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => {
                                                        // 确保status值正确传递给Select组件
                                                        const statusValue = field.value;
                                                        console.log("Status in render:", statusValue);
                                                        return (
                                                        <FormItem>
                                                            <FormLabel>{t('status')}</FormLabel>
                                                            {board && board.status && (
                                                            <Select 
                                                                key={`status-select-${board.id}-${board.status}`}
                                                                onValueChange={field.onChange}
                                                                value={statusValue}
                                                                defaultValue={board.status}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue>
                                                                            {statusValue === 'approved' && <span className="text-green-500 font-medium">{t('approved')}</span>}
                                                                            {statusValue === 'pending' && <span className="text-yellow-500 font-medium">{t('pending')}</span>}
                                                                            {statusValue === 'rejected' && <span className="text-red-500 font-medium">{t('rejected')}</span>}
                                                                        </SelectValue>
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="approved"><span className="text-green-500 font-medium">{t('approved')}</span></SelectItem>
                                                                    <SelectItem value="pending"><span className="text-yellow-500 font-medium">{t('pending')}</span></SelectItem>
                                                                    <SelectItem value="rejected"><span className="text-red-500 font-medium">{t('rejected')}</span></SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            )}
                                                            <FormMessage className="text-red-500 text-sm" />
                                                        </FormItem>
                                                        )
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* Active Status Dropdown */}
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name="is_active"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('activeStatus')}</FormLabel>
                                                            <Select 
                                                                onValueChange={(value) => field.onChange(value === 'true')} 
                                                                defaultValue={field.value ? 'true' : 'false'}
                                                                value={field.value ? 'true' : 'false'}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue placeholder={t('selectActiveStatus')} />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="true">
                                                                        <span className="text-green-500 font-medium">{t('active')}</span>
                                                                    </SelectItem>
                                                                    <SelectItem value="false">
                                                                        <span className="text-red-500 font-medium">{t('inactive')}</span>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="text-red-500 text-sm" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* 第三行：description */}
                                    <div>
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('description')}</FormLabel>
                                                <FormControl>
                                                <Textarea
                                                    id="description"
                                                    {...field}
                                                    className="w-full"
                                                    placeholder={t('enterDescription')}
                                                    maxLength={100}
                                                />
                                                </FormControl>
                                                <div className="flex justify-between mt-1">
                                                <FormMessage className="text-red-500 text-sm" />
                                                <span />
                                                <span className="text-muted-foreground text-sm">
                                                    {field.value?.trim().length || 0}/100
                                                </span>
                                                </div>
                                            </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('category')}</FormLabel>
                                                    <FormControl>
                                                        <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between">
                                                                    <span className="truncate">{formatSelectedCategories()}</span>
                                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-64 p-0">
                                                                <Command>
                                                                    <CommandInput 
                                                                        placeholder={t('searchCategories')} 
                                                                        value={searchCategory}
                                                                        onValueChange={setSearchCategory}
                                                                    />
                                                                    <CommandList>
                                                                        <CommandEmpty>{t('noResults')}</CommandEmpty>
                                                                        <CommandGroup heading={t('categories')}>
                                                                            {searchCategory ? 
                                                                                filteredCategories.map(category => (
                                                                                    <CommandItem 
                                                                                        key={category.id}
                                                                                        onSelect={() => toggleCategory(category.id)}
                                                                                    >
                                                                                        <Folder className="h-4 w-4 mr-2" />
                                                                                        {category.name}
                                                                                        {boardCategories.includes(category.id) && (
                                                                                            <Check className="h-4 w-4 ml-auto" />
                                                                                        )}
                                                                                    </CommandItem>
                                                                                )) : 
                                                                                renderCategoryItems(organizedCategories)
                                                                            }
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* 底部选项 - 左侧 */}
                                    <div className="md:col-span-2">
                                        {/* Visibility */}
                                        <FormField
                                            control={form.control}
                                            name="visibility"
                                            render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value === 'public'}
                                                    onCheckedChange={(checked) => {
                                                        field.onChange(checked ? 'public' : 'private');
                                                    }}
                                                />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormDescription>
                                                        {t('enableVisibilityPublicDescription')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Bottom: Anonymous Post (full width) */}
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="anonymousPost"
                                            render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormDescription>
                                                        {t('enableAnonymousPostDescription')}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </div>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                </form>
                            </Form>
                            <DialogFooter>
                                <div className="flex justify-between w-full">
                                    <PreviewBoard 
                                        boardData={() => form.getValues()}
                                        trigger={
                                            <Button type="button" variant="orange">
                                                {t('previewBoard')}
                                            </Button>
                                        }
                                    />
                                    <div className="flex flex-row gap-2">
                                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                                            {t('cancel')}
                                        </Button>
                                        <Button type="submit" variant="orange" onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
                                            {isPending ? t('updating') : t('updateButton')}
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
