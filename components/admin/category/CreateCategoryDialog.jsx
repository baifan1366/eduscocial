'use client'

import useCreateCategory from '@/hooks/admin/category/useCreateCategory'
import useGetCategories from '@/hooks/admin/category/useGetCategories'
import { useTranslations } from 'next-intl'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../ui/form';
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Icon } from '@iconify/react'
import useCheckCategoryExists from '@/hooks/admin/category/useCheckCategoryExists'
import { debounce } from 'lodash'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CreateCategoryDialog = forwardRef(({ children, onClick }, ref) => {
    const t = useTranslations('Category')
    const [openDialog, setOpenDialog] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [categoryNameToCheck, setCategoryNameToCheck] = useState('')
    const [parentId, setParentId] = useState(null)

    // 获取所有分类，用于选择父分类
    const { data: categoriesData } = useGetCategories({
        enabled: openDialog
    })

    // 使用自定义钩子检查板块名称是否存在
    const { data: categoryExistsData, isLoading: isCheckingCategoryName } = useCheckCategoryExists({
        name: categoryNameToCheck,
        enabled: !!categoryNameToCheck && categoryNameToCheck.length > 0
    });

    // debounce函数，延迟检查板块名称
    const debouncedCheckCategoryName = debounce((name) => {
        if (name && name.trim().length > 0) {
            setCategoryNameToCheck(name.trim());
        }
    }, 500);

    const allIcons = [
        'mdi:account', 'mdi:school', 'mdi:food', 'mdi:gamepad-variant', 'mdi:music', 'mdi:movie-open', 
        'mdi:palette', 'mdi:briefcase-outline', 'mdi:robot-outline', 'mdi:book-open-page-variant', 'mdi:leaf', 'mdi:dog', 
        'mdi:airplane', 'mdi:basketball', 'mdi:comment-question-outline', 'mdi:hand-heart', 'mdi:star-outline', 'mdi:emoji-happy', 
        'mdi:compass-outline', 'mdi:alarm'
    ];

    const form = useForm({
        resolver: zodResolver(
            z.object({
                name: z.string({
                    required_error: t('nameRequired'),
                    invalid_type_error: t('nameInvalidType'),
                }).min(1, {message: t('nameRequired')}).max(20, {message: t('nameMaxLength')}),
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
                parentId: z.string().optional().nullable(),
            })
        ),
        defaultValues: {
            name: '',
            description: '',
            color: '#000000',
            categoryIcon: 'mdi:emoji-happy',
            parentId: null,
        },  
    });

    //reset form
    useEffect(() => {
        if (openDialog) {
            form.reset({
                name: '',
                description: '',
                color: '#000000',
                categoryIcon: 'mdi:emoji-happy',
                parentId: null,
            });
            setParentId(null);
        }
    }, [openDialog, form]);

    const { mutate: createCategory, isPending } = useCreateCategory({
        onSuccess: () => {
            setOpenDialog(false)
            toast.success(t('categoryCreated'))
            // 调用父组件传入的onClick回调，用于刷新数据
            if (typeof onClick === 'function') {
                onClick()
            }
        },
        onError: (error) => {
            toast.error(t('categoryCreationFailed'))
        }
    })

    const onSubmit = async (data) => { 
        // 如果分类名称已存在，阻止提交并显示错误
        if (categoryExistsData?.exists) {
            form.setError('name', {
                type: 'manual',
                message: t('categoryAlreadyExists')
            });
            return;
        }

        // 处理父分类选择
        const selectedParentId = data.parentId === "null" ? null : data.parentId;
        createCategory({ 
            data: { 
                name: data.name,
                description: data.description,
                color: data.color,
                categoryIcon: data.categoryIcon,
                parent_id: selectedParentId 
            } 
        });
    };

    // 暴露给父组件的函数
    useImperativeHandle(ref, () => ({
        openWithParent: (id) => {
            setParentId(id)
            setOpenDialog(true)
            // 如果有传入父ID，设置表单的parentId值
            if (id) {
                form.setValue('parentId', id.toString());
            }
        }
    }))

    return (
        <>
            {children ? (
                <div onClick={() => setOpenDialog(true)}>
                    {children}
                </div>
            ) : (
                <Button onClick={() => setOpenDialog(true)}>
                    {t('createButton')}
                </Button>
            )}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('createCategory')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('createCategoryDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form} className="space-y-4">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT 1st Row: Board Name */}
                            <div>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('name')} <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                        <Input 
                                            id="name" 
                                            {...field}
                                            className="w-full"
                                            autoFocus
                                            placeholder={t('namePlaceholder')}
                                            maxLength={20}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                // 当输入分类名称时自动更新分类名称
                                                debouncedCheckCategoryName(e.target.value);
                                            }}
                                        />
                                        </FormControl>
                                        <div className="flex justify-between mt-1">
                                            <div className="text-red-500 text-sm">
                                                {isCheckingCategoryName ? (
                                                    <span>{t('checkingCategoryName')}</span>
                                                ) : (
                                                    <FormMessage />
                                                )}
                                            </div>
                                            <span />                                        
                                            <span className="text-muted-foreground text-sm">
                                                {field.value?.trim().length || 0}/20
                                            </span>
                                        </div>
                                    </FormItem>
                                    )}
                                />
                            </div>
                            
                            {/* RIGHT 1st Row: Color, Icon */}
                            <div className="space-y-4">
                                <div className="flex flex-row gap-4">
                                    {/* Color */}
                                    <div className="w-32">
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
                                    <div className="w-40">
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
                            
                            <div className="md:col-span-1 w-full">
                                <FormField
                                    control={form.control}
                                    name="parentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('parentCategory')}</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value || "null"}
                                                value={field.value || "null"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full min-w-[200px]">
                                                        <SelectValue placeholder={t('selectParentCategory')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="null">{t('noParent')}</SelectItem>
                                                    {categoriesData?.categories?.map(category => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                             {/* Description and Parent Category in same row */}
                             <div className="md:col-span-1">
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
                        </form>                        
                    </Form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>{t('cancel')}</Button>
                        <Button type="submit" variant="orange" disabled={isPending || isCheckingCategoryName} onClick={form.handleSubmit(onSubmit)}>
                            {isPending ? t('creating') : t('createButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
})

CreateCategoryDialog.displayName = 'CreateCategoryDialog'

export default CreateCategoryDialog