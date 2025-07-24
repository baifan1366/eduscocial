'use client'

import { useState, useMemo, useEffect } from 'react'
import useGetBoards from '@/hooks/useGetBoards'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Icon } from '@iconify/react'
import { Search, VenetianMask, ListFilter, BookOpenCheck, CheckCircle, Globe, X, ScanEye, MoveUp, MoveDown, Plus, UserRound, Pen, ChevronDown, Check, Folder, FolderOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslations } from 'next-intl'
import CreateBoardDialog from './CreateBoardDialog'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import EditBoardDialog from './EditBoardDialog' 
import useUpdateBoardActiveStatus from '@/hooks/admin/board/useUpdateBoardActiveStatus'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useUpdateBoardStatus from '@/hooks/admin/board/useUpdateBoardStatus'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useMatchBoardWithCategory from '@/hooks/admin/board-category/useMatchBoardWithCategory'
import useGetCategories from '@/hooks/admin/category/useGetCategories'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Skeleton } from "@/components/ui/skeleton"

export default function DisplayAllBoards() {
    const { data, refetch, isLoading: isBoardsLoading } = useGetBoards({ includeCategoryData: true })
    const boardsData = data?.boards || []
    const t = useTranslations('Board')
    const [search, setSearch] = useState('')
    const [nameSort, setNameSort] = useState('asc')
    const [slugSort, setSlugSort] = useState('asc')
    const [createdAtSort, setCreatedAtSort] = useState('asc')
    const [currentSortField, setCurrentSortField] = useState('no') // Track which field is being sorted
    const { mutate: updateBoardActiveStatus } = useUpdateBoardActiveStatus()
    const { mutate: updateBoardStatus } = useUpdateBoardStatus()
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [boardIdForCategories, setBoardIdForCategories] = useState(null)
    
    // 使用useGetCategories获取所有分类
    const { data: allCategoriesData } = useGetCategories()
    const categories = allCategoriesData?.categories || []
    
    const { mutate: updateBoardCategories } = useMatchBoardWithCategory()
    const [searchCategory, setSearchCategory] = useState('')
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)

    // 为每个看板的分类选择保持状态
    const [boardCategories, setBoardCategories] = useState({})
    
    // 跟踪当前显示的board IDs
    const [visibleBoardIds, setVisibleBoardIds] = useState([])
    
    // 总体加载状态
    const isLoading = isBoardsLoading;

    // 在组件初始化时，从boardsData获取分类信息
    useEffect(() => {
        if (boardsData.length > 0) {
            const categoriesMap = {};
            boardsData.forEach(board => {
                if (board.categories) {
                    categoriesMap[board.id] = board.categories.map(cat => cat.category_id);
                } else {
                    categoriesMap[board.id] = [];
                }
            });
            
            setBoardCategories(categoriesMap);
        }
    }, [boardsData]);
    
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

    // 处理分类选择
    const toggleCategory = async (boardId, categoryId) => {
        // 初始化当前看板的分类状态
        if (!boardCategories[boardId]) {
            const currentBoard = boardsData.find(board => board.id === boardId)
            const currentBoardCategories = currentBoard?.categories?.map(cat => cat.category_id) || []
            
            setBoardCategories(prev => ({
                ...prev,
                [boardId]: currentBoardCategories
            }))
            return
        }
        
        // 检查分类是否已经被选择
        const isSelected = boardCategories[boardId]?.includes(categoryId)
        
        // 更新选择状态
        const updatedCategories = isSelected 
            ? boardCategories[boardId].filter(id => id !== categoryId)
            : [...(boardCategories[boardId] || []), categoryId]
            
        setBoardCategories(prev => ({
            ...prev,
            [boardId]: updatedCategories
        }))
        
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
    
    // 递归渲染分类项
    const renderCategoryItems = (categories, level = 0) => {
        return categories.map(category => (
            <div key={category.id}>
                <CommandItem
                    value={`category-${category.id}`}
                    onSelect={() => toggleCategory(boardIdForCategories, category.id)}
                    className={`pl-${level * 4 + 2} flex items-center gap-2`}
                >
                    <Icon icon={category.icon} style={{color: category.color}} className="h-4 w-4" />
                    <span>{category.name}</span>
                    {boardCategories[boardIdForCategories]?.includes(category.id) && (
                        <Check className="h-4 w-4 ml-auto" />
                    )}
                </CommandItem>
                {category.children?.length > 0 && renderCategoryItems(category.children, level + 1)}
            </div>
        ));
    }

    // 格式化显示已选分类
    const formatSelectedCategories = (boardId) => {
        if (!boardCategories[boardId] || boardCategories[boardId].length === 0) {
            return t('noCategory')
        }
        
        const selectedCategoryNames = boardCategories[boardId]
            .map(id => categories.find(cat => cat.id === id)?.name || '')
            .filter(Boolean)
        
        return selectedCategoryNames.length > 2 
            ? `${selectedCategoryNames.slice(0, 2).join(', ')} +${selectedCategoryNames.length - 2}`
            : selectedCategoryNames.join(', ')
    }
    
    // 加载看板初始分类数据
    useEffect(() => {
        // 从已获取的板块数据中初始化分类状态
        const initBoardCategories = () => {
            const categoriesMap = {}
            
            boardsData.forEach(board => {
                if (board.categories) {
                    categoriesMap[board.id] = board.categories.map(cat => cat.category_id)
                } else {
                    categoriesMap[board.id] = []
                }
            })
            
            setBoardCategories(categoriesMap)
        }
        
        if (boardsData.length > 0) {
            initBoardCategories()
        }
    }, [boardsData])

    const [filter, setFilter] = useState({
        language: 'all',
        visibility: 'all',
        status: 'all',
        anonymous: 'all',
        is_active: 'all',
        created_at: 'all',
    })

    // 添加多选状态
    const [selectedLanguages, setSelectedLanguages] = useState({
        'zh-TW': true,
        'en-US': true
    })
    
    const [selectedVisibility, setSelectedVisibility] = useState({
        'public': true,
        'private': true
    })
    
    const [selectedStatus, setSelectedStatus] = useState({
        'pending': true,
        'approved': true,
        'rejected': true
    })
    
    const [selectedAnonymous, setSelectedAnonymous] = useState({
        'true': true,
        'false': true
    })
    
    const [selectedActive, setSelectedActive] = useState({
        'true': true,
        'false': true
    })

    // 处理多选切换
    const toggleLanguage = (lang) => {
        setSelectedLanguages({
            ...selectedLanguages,
            [lang]: !selectedLanguages[lang]
        })
        
        // 更新过滤器状态
        // 如果所有选项都选中或都未选中，则设为'all'
        const allSelected = Object.values({...selectedLanguages, [lang]: !selectedLanguages[lang]}).every(v => v);
        const noneSelected = Object.values({...selectedLanguages, [lang]: !selectedLanguages[lang]}).every(v => !v);
        
        if (allSelected || noneSelected) {
            setFilter({...filter, language: 'all'});
        } else {
            // 否则使用自定义过滤逻辑
            setFilter({...filter, language: 'custom'});
        }
    }
    
    const toggleVisibility = (value) => {
        setSelectedVisibility({
            ...selectedVisibility,
            [value]: !selectedVisibility[value]
        })
        
        const newState = {...selectedVisibility, [value]: !selectedVisibility[value]};
        const allSelected = Object.values(newState).every(v => v);
        const noneSelected = Object.values(newState).every(v => !v);
        
        if (allSelected || noneSelected) {
            setFilter({...filter, visibility: 'all'});
        } else {
            setFilter({...filter, visibility: 'custom'});
        }
    }
    
    // 只用于筛选面板的状态切换
    const toggleStatusFilter = (value) => {
        setSelectedStatus({
            ...selectedStatus,
            [value]: !selectedStatus[value]
        })

        // 更新过滤状态
        const newState = {...selectedStatus, [value]: !selectedStatus[value]};
        const allSelected = Object.values(newState).every(v => v);
        const noneSelected = Object.values(newState).every(v => !v);
        
        if (allSelected || noneSelected) {
            setFilter({...filter, status: 'all'});
        } else {
            setFilter({...filter, status: 'custom'});
        }
    }
    
    // 用于更新看板状态的函数
    const handleStatusChange = (boardId, value) => {
        // 更新后端状态
        updateBoardStatus({
            boardId: boardId,
            data: { status: value }
        });
    }
    
    const toggleAnonymous = (value) => {
        setSelectedAnonymous({
            ...selectedAnonymous,
            [value]: !selectedAnonymous[value]
        })
        
        const newState = {...selectedAnonymous, [value]: !selectedAnonymous[value]};
        const allSelected = Object.values(newState).every(v => v);
        const noneSelected = Object.values(newState).every(v => !v);
        
        if (allSelected || noneSelected) {
            setFilter({...filter, anonymous: 'all'});
        } else {
            setFilter({...filter, anonymous: 'custom'});
        }
    }
    
    const toggleActive = (boardId, value) => {
        // 更新后端状态
        updateBoardActiveStatus({
            boardId: boardId,
            data: { is_active: value }
        });

        // 更新过滤状态（仅在从筛选器面板点击时使用）
        const newState = {...selectedActive, [value]: !selectedActive[value]};
        const allSelected = Object.values(newState).every(v => v);
        const noneSelected = Object.values(newState).every(v => !v);
        
        if (allSelected || noneSelected) {
            setFilter({...filter, is_active: 'all'});
        } else {
            setFilter({...filter, is_active: 'custom'});
        }
    }

    // search by name, slug, language, visibility, status, anonymous, is_active, created_at
    const handleSearch = (value) => {
        setSearch(value)
    }

    //sort by ascending or descending for selected column in table
    //each column has a sort icon, when clicked, it will sort by ascending or descending
    const handleSort = (key) => {
        setCurrentSortField(key) // Set the current sort field
        
        // Update filter with the sort key and current sort value
        switch(key) {
            case 'name':
                setNameSort(nameSort === 'asc' ? 'desc' : 'asc')
                break
            case 'slug':
                setSlugSort(slugSort === 'asc' ? 'desc' : 'asc')
                break
            case 'created_at':
                setCreatedAtSort(createdAtSort === 'asc' ? 'desc' : 'asc')
                break
            default:
                break
        }
        
        // Update filter with the new sort value
        const newSortValue = key === 'name' ? (nameSort === 'asc' ? 'desc' : 'asc') :
                            key === 'slug' ? (slugSort === 'asc' ? 'desc' : 'asc') :
                            key === 'created_at' ? (createdAtSort === 'asc' ? 'desc' : 'asc') : 'asc'
        
        setFilter({ ...filter, [key]: newSortValue })
    }

    // Sort and filter the boards data
    const sortedBoards = useMemo(() => {
        // First, filter the data based on search term
        let filteredData = [...boardsData] // Create a copy to avoid mutations
        if (search) {
            filteredData = filteredData.filter(board => 
                (board.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                (board.slug?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (board.language?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (board.visibility?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (board.status?.toLowerCase() || '').includes(search.toLowerCase()) ||
                (board.anonymous?.toString().toLowerCase() || '').includes(search.toLowerCase()) ||
                (board.created_at ? new Date(board.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase() : '').includes(search.toLowerCase())
            )
        }

        // Apply filters
        if (filter.language === 'custom') {
            // 使用自定义语言过滤
            filteredData = filteredData.filter(board => 
                selectedLanguages[board.language] === true
            );
        } else if (filter.language !== 'all') {
            filteredData = filteredData.filter(board => board.language === filter.language)
        }
        
        if (filter.visibility === 'custom') {
            filteredData = filteredData.filter(board => 
                selectedVisibility[board.visibility] === true
            );
        } else if (filter.visibility !== 'all') {
            filteredData = filteredData.filter(board => board.visibility === filter.visibility)
        }
        
        if (filter.status === 'custom') {
            filteredData = filteredData.filter(board => 
                selectedStatus[board.status] === true
            );
        } else if (filter.status !== 'all') {
            filteredData = filteredData.filter(board => board.status === filter.status)
        }
        
        if (filter.anonymous === 'custom') {
            filteredData = filteredData.filter(board => {
                // 确保布尔值转换为字符串，用于匹配选择器键
                const boolStr = String(!!board.anonymous);
                return selectedAnonymous[boolStr] === true;
            });
        } else if (filter.anonymous !== 'all') {
            filteredData = filteredData.filter(board => !!board.anonymous === (filter.anonymous === 'true'))
        }
        
        if (filter.is_active === 'custom') {
            filteredData = filteredData.filter(board => {
                // 确保布尔值转换为字符串，用于匹配选择器键
                const boolStr = String(!!board.is_active);
                return selectedActive[boolStr] === true;
            });
        } else if (filter.is_active !== 'all') {
            filteredData = filteredData.filter(board => !!board.is_active === (filter.is_active === 'true'))
        }

        // Then sort based on the current sort field and direction
        return filteredData.sort((a, b) => {
            let sortOrder = 1
            
            // Determine current sort direction
            switch(currentSortField) {
                case 'name':
                    sortOrder = nameSort === 'asc' ? 1 : -1
                    // Handle potential undefined values
                    const nameA = a.name || ''
                    const nameB = b.name || ''
                    return sortOrder * nameA.localeCompare(nameB)
                case 'slug':
                    sortOrder = slugSort === 'asc' ? 1 : -1
                    const slugA = a.slug || ''
                    const slugB = b.slug || ''
                    return sortOrder * slugA.localeCompare(slugB)
                case 'created_at':
                    sortOrder = createdAtSort === 'asc' ? 1 : -1
                    // Handle potential undefined dates
                    const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
                    const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
                    return sortOrder * (dateA - dateB)
                default:
                    return 0
            }
        })
    }, [boardsData, search, filter, currentSortField, nameSort, slugSort, createdAtSort, 
        selectedLanguages, selectedVisibility, selectedStatus, selectedAnonymous, selectedActive])

    // 计算分页数据 - 移除状态更新操作
    const paginatedBoards = useMemo(() => {
        // 计算当前页的起始和结束索引
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        
        // 返回当前页的数据
        return sortedBoards.slice(startIndex, endIndex)
    }, [sortedBoards, currentPage, pageSize])

    // 使用useEffect处理分页状态更新
    useEffect(() => {
        // 计算总页数
        const total = Math.ceil(sortedBoards.length / pageSize) || 1
        setTotalPages(total)
        
        // 如果当前页码超出总页数，重置为第一页
        if (currentPage > total) {
            setCurrentPage(1)
        }
    }, [sortedBoards.length, pageSize, currentPage])

    // 更新可见的board IDs
    useEffect(() => {
        if (paginatedBoards && paginatedBoards.length > 0) {
            const ids = paginatedBoards.map(board => board.id)
            setVisibleBoardIds(ids)
        }
    }, [paginatedBoards])

    // show created at in format YYYY-MM-DD
    const formatCreatedAt = (createdAt) => {
        const date = new Date(createdAt)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    // 骨架屏组件
    const TableSkeleton = () => (
        <div className="w-full">
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )

    return (
        <div className='w-full'>
            <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className="text-xl font-bold">{t('boards')}</h2>
                    {/*左侧部分：筛选器和搜索栏*/}
                    <div className='flex items-center gap-2 w-2/3'>
                        {/*filter language, visibility, status, anonymous, is_active, created at*/}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant='ghost'>
                                    <ListFilter className='w-4 h-4 mr-2' />
                                    {t('filter')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full">
                                <div className='flex flex-col gap-4'>
                                    {/* 语言筛选 - 使用Badge多选 */}
                                    <div className='flex flex-col gap-2'>
                                        <Label className="font-medium border-b border-gray-800 pb-2">
                                            <Globe className='w-4 h-4 inline-block mr-2' />
                                            {t('language')}
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            <Badge 
                                                variant={selectedLanguages['zh-TW'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedLanguages['zh-TW'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleLanguage('zh-TW')}
                                            >
                                                {t('chinese')}
                                                {selectedLanguages['zh-TW'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleLanguage('zh-TW');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedLanguages['en-US'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedLanguages['en-US'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleLanguage('en-US')}
                                            >
                                                {t('english')}
                                                {selectedLanguages['en-US'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleLanguage('en-US');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    {/* 可见性筛选 - 标签多选 */}
                                    <div className='flex flex-col gap-2'>
                                        <Label className="font-medium border-b border-gray-800 pb-2">
                                            <ScanEye className='w-4 h-4 inline-block mr-2' />
                                            {t('visibility')}
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            <Badge 
                                                variant={selectedVisibility['public'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedVisibility['public'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleVisibility('public')}
                                            >
                                                {t('public')}
                                                {selectedVisibility['public'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleVisibility('public');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedVisibility['private'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedVisibility['private'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleVisibility('private')}
                                            >
                                                {t('private')}
                                                {selectedVisibility['private'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleVisibility('private');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* 状态筛选 - 标签多选 */}
                                    <div className='flex flex-col gap-2'>
                                        <Label className="font-medium border-b border-gray-800 pb-2">
                                            <BookOpenCheck className='w-4 h-4 inline-block mr-2' />
                                            {t('status')}
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            <Badge 
                                                variant={selectedStatus['pending'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedStatus['pending'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleStatusFilter('pending')}
                                            >
                                                {t('pending')}
                                                {selectedStatus['pending'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleStatusFilter('pending');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedStatus['approved'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedStatus['approved'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleStatusFilter('approved')}
                                            >
                                                {t('approved')}
                                                {selectedStatus['approved'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleStatusFilter('approved');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedStatus['rejected'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedStatus['rejected'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleStatusFilter('rejected')}
                                            >
                                                {t('rejected')}
                                                {selectedStatus['rejected'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleStatusFilter('rejected');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* 匿名筛选 - 标签多选 */}
                                    <div className='flex flex-col gap-2'>
                                        <Label className="font-medium border-b border-gray-800 pb-2">
                                            <VenetianMask className='w-4 h-4 inline-block mr-2' />
                                            {t('anonymous')}
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            <Badge 
                                                variant={selectedAnonymous['true'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedAnonymous['true'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleAnonymous('true')}
                                            >
                                                {t('yes')}
                                                {selectedAnonymous['true'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleAnonymous('true');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedAnonymous['false'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedAnonymous['false'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleAnonymous('false')}
                                            >
                                                {t('no')}
                                                {selectedAnonymous['false'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleAnonymous('false');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* 活跃状态筛选 - 标签多选 */}
                                    <div className='flex flex-col gap-2'>
                                        <Label className="font-medium border-b border-gray-800 pb-2">
                                            <CheckCircle className='w-4 h-4 inline-block mr-2' />
                                            {t('active')}
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                            <Badge 
                                                variant={selectedActive['true'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedActive['true'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleActive('true')}
                                            >
                                                {t('yes')}
                                                {selectedActive['true'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActive('true');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                            <Badge 
                                                variant={selectedActive['false'] ? "outline" : "ghost"}
                                                className={`flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted/50 ${selectedActive['false'] ? 'border border-primary/50' : ''}`}
                                                onClick={() => toggleActive('false')}
                                            >
                                                {t('no')}
                                                {selectedActive['false'] && (
                                                    <X 
                                                        className="h-3 w-3 ml-1 cursor-pointer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActive('false');
                                                        }}
                                                    />
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/*搜索框带内置图标*/}
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

                    {/*create board button*/}   
                    <div className='flex items-center'>
                        <CreateBoardDialog onBoardCreated={() => refetch()}>
                            <Button 
                                variant="orange"
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                {t('createBoard')}
                            </Button>
                        </CreateBoardDialog>
                    </div>
                </div>
            </div>
            
            {/* 显示骨架屏或数据表格 */}
            {isLoading ? (
                <TableSkeleton />
            ) : (
                <>
                    {/*search result will be shown here*/}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t('no')}
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        {t('name')}
                                        {nameSort === 'asc' ? (
                                            <MoveUp className="w-4 h-4 cursor-pointer" onClick={() => handleSort('name')} />
                                        ) : (
                                            <MoveDown className="w-4 h-4 cursor-pointer" onClick={() => handleSort('name')} />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        {t('slug')}
                                        {slugSort === 'asc' ? (
                                            <MoveUp className="w-4 h-4 cursor-pointer" onClick={() => handleSort('slug')} />
                                        ) : (
                                            <MoveDown className="w-4 h-4 cursor-pointer" onClick={() => handleSort('slug')} />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>
                                    {t('language')}
                                </TableHead>
                                <TableHead>
                                    {t('visibility')}
                                </TableHead>
                                <TableHead className="w-1/12">
                                    {t('status')}
                                </TableHead>
                                <TableHead className="w-1/12">
                                    {t('category')}
                                </TableHead>
                                <TableHead>
                                    {t('active')}
                                </TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1">
                                        {t('createdAt')}
                                        {createdAtSort === 'asc' ? (
                                            <MoveUp className="w-4 h-4 cursor-pointer" onClick={() => handleSort('created_at')} />
                                        ) : (
                                            <MoveDown className="w-4 h-4 cursor-pointer" onClick={() => handleSort('created_at')} />
                                        )}
                                    </div>
                                </TableHead>
                                <TableHead>
                                    {t('actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBoards.map((board, index) => (
                                <TableRow key={board.id}>
                                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center w-full">
                                            {board.anonymous ? (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <VenetianMask className='w-4 h-4 text-green-500' />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {t('anonymousBoard')}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <UserRound className='w-4 h-4 text-red-500' />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {t('nonAnonymousBoard')}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                            <span className="ml-2">{board.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{board.slug}</TableCell>
                                    <TableCell>
                                        {board.language === 'zh-TW' ? t('chinese') : t('english')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={board.visibility === 'public' ? 'public' : 'private'}>
                                            {board.visibility === 'public' ? t('public') : t('private')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>  
                                            <DropdownMenuTrigger asChild>
                                                <div className="flex items-center cursor-pointer justify-between">
                                                    <Badge variant={board.status === 'pending' ? 'pending' : board.status === 'approved' ? 'approved' : 'rejected'}>
                                                        {board.status === 'pending' ? t('pending') : board.status === 'approved' ? t('approved') : t('rejected')}
                                                        <ChevronDown className='w-4 h-4 hover:text-[#FF7D00] ml-2' />
                                                    </Badge>                                            
                                                </div>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleStatusChange(board.id, 'pending')}>{t('pending')}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(board.id, 'approved')}>{t('approved')}</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(board.id, 'rejected')}>{t('rejected')}</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="w-1/12">
                                        <Popover open={boardIdForCategories === board.id && categoryDropdownOpen} onOpenChange={(open) => {
                                            if (open) {
                                                setBoardIdForCategories(board.id)
                                            }
                                            setCategoryDropdownOpen(open)
                                        }}>
                                            <PopoverTrigger asChild>
                                                <div className="flex items-center cursor-pointer justify-between">
                                                    <Badge variant="outline">
                                                        {formatSelectedCategories(board.id)}
                                                        <ChevronDown className='w-4 h-4 hover:text-[#FF7D00] ml-2' />
                                                    </Badge>                                            
                                                </div>
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
                                                                        onSelect={() => toggleCategory(board.id, category.id)}
                                                                    >
                                                                        <Folder className="h-4 w-4 mr-2" />
                                                                        {category.name}
                                                                        {boardCategories[board.id]?.includes(category.id) && (
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
                                    </TableCell>
                                    <TableCell>
                                        <Switch 
                                            checked={board.is_active} 
                                            onCheckedChange={() => toggleActive(board.id, !board.is_active)}                                    
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatCreatedAt(board.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <EditBoardDialog boardId={board.id}>
                                            <Button variant='ghost'>
                                                <Pen className='w-4 h-4' />
                                            </Button>
                                        </EditBoardDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                                {t('rowsPerPage')}
                            </p>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(value) => setPageSize(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-6 lg:space-x-8">
                            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                {t('page')} {currentPage} {t('of')} {totalPages}
                            </div>
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious 
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                            aria-disabled={currentPage === 1}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    
                                    {/* 显示页码，最多显示5个 */}
                                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                        // 如果总页数小于5，直接显示所有页码
                                        if (totalPages <= 5) {
                                            const page = i + 1;
                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationLink 
                                                        isActive={currentPage === page}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        
                                        // 如果总页数大于5，创建动态页码区间
                                        let startPage = Math.max(currentPage - 2, 1);
                                        if (currentPage > totalPages - 2) {
                                            startPage = Math.max(totalPages - 4, 1);
                                        }
                                        const page = startPage + i;
                                        
                                        if (page <= totalPages) {
                                            return (
                                                <PaginationItem key={page}>
                                                    <PaginationLink 
                                                        isActive={currentPage === page}
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        return null;
                                    })}
                                    
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                                                    {totalPages}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}
                                    
                                    <PaginationItem>
                                        <PaginationNext 
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                            aria-disabled={currentPage === totalPages}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}