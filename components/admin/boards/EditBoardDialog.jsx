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
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { SketchPicker } from 'react-color'
import PreviewBoard from './PreviewBoard'
import { toast } from 'sonner'
import { debounce } from 'lodash'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditBoardDialog({ boardId, children }) {
    const t = useTranslations('Board')
    const [openDialog, setOpenDialog] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [boardNameToCheck, setBoardNameToCheck] = useState('')
    
    //get board data
    const { data: board, isLoading: isLoadingBoard, refetch } = useGetBoardByBoardId(boardId, {
        enabled: openDialog, // 只在对话框打开时获取数据
    })

    // 当对话框打开时，获取板块数据
    useEffect(() => {
        if (openDialog && boardId) {
            refetch()
        }
    }, [openDialog, boardId, refetch])

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
            })
        })),
        defaultValues: {
            boardName: '',
            slug: '',
            description: '',
            color: '#000000',
            categoryIcon: 'mdi:emoji-happy',
            visibility: 'private',   
            anonymousPost: false,
        },
    })

    // 当板块数据加载完成时，填充表单
    useEffect(() => {
        if (board) {
            form.reset({
                boardName: board.name || '',
                slug: board.slug || '',
                description: board.description || '',
                color: board.color || '#000000',
                categoryIcon: board.icon || 'mdi:emoji-happy',
                visibility: board.visibility || 'private',
                anonymousPost: board.anonymousPost || false,
            })
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
                <DialogContent className="text-muted-foreground overflow-y-auto space-y-4 min-w-100">
                    <DialogHeader>
                        <DialogTitle>{t('editBoard')}</DialogTitle>
                        <DialogDescription>{t('editBoardDescription')}</DialogDescription>
                    </DialogHeader>
                    
                    {isLoadingBoard ? (
                        <div className="flex items-center justify-center py-10">
                            <Skeleton className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <Form {...form} className="space-y-4">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* LEFT 1st Row: Board Name */}
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
                                    {/* RIGHT 2nd Row: Color, Icon, Visibility */}
                                    <div className="space-y-4">
                                        <div className="flex flex-row gap-4">
                                            {/* Color */}
                                            <div className="w-20">
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
                                            <div className="w-28">
                                                <FormField
                                                    control={form.control}
                                                    name="categoryIcon"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('categoryIcon')} <span className="text-red-500">*</span></FormLabel>
                                                        <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline">
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
                                        </div>
                                    </div>
                                    {/* LEFT 2nd Row: Description */}
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
                                    {/* RIGHT 1st Row: Slug */}
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
                                    {/* Visibility: if tick means public, else private */}
                                    <div className="md:col-span-2">
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
