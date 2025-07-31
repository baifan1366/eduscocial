'use client'

import useUpdateCategory from '@/hooks/admin/category/useUpdateCategory'
import { useTranslations } from 'next-intl'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
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

const EditCategoryDialog = forwardRef(({ onSuccess }, ref) => {
    const t = useTranslations('Category')
    const [openDialog, setOpenDialog] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [category, setCategory] = useState(null)
    const [categoryNameToCheck, setCategoryNameToCheck] = useState('')

    // 图标列表
    const allIcons = [
        'mdi:account', 'mdi:school', 'mdi:food', 'mdi:gamepad-variant', 'mdi:music', 'mdi:movie-open', 
        'mdi:palette', 'mdi:briefcase-outline', 'mdi:robot-outline', 'mdi:book-open-page-variant', 'mdi:leaf', 'mdi:dog', 
        'mdi:airplane', 'mdi:basketball', 'mdi:comment-question-outline', 'mdi:hand-heart', 'mdi:star-outline', 'mdi:emoji-happy', 
        'mdi:compass-outline', 'mdi:alarm'
    ];

    // 使用自定义钩子检查分类名称是否存在（排除当前分类）
    const { data: categoryExistsData, isLoading: isCheckingCategoryName } = useCheckCategoryExists({
        name: categoryNameToCheck,
        exclude_id: category?.id,
        enabled: !!categoryNameToCheck && categoryNameToCheck.length > 0
    });

    // debounce函数，延迟检查分类名称
    const debouncedCheckCategoryName = debounce((name) => {
        if (name && name.trim().length > 0) {
            setCategoryNameToCheck(name.trim());
        }
    }, 500);

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
                icon: z.string({
                    required_error: t('categoryIconRequired'),
                    invalid_type_error: t('categoryIconInvalidType'),
                }).max(50, {message: t('categoryIconMaxLength')}),
            })
        ),
        defaultValues: {
            name: '',
            description: '',
            color: '#6366F1',
            icon: 'mdi:folder',
        },
    });

    // 使用更新分类的Hook
    const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory({
        onSuccess: () => {
            toast.success(t('subcategory_updated'))
            setOpenDialog(false)
            if (typeof onSuccess === 'function') {
                onSuccess()
            }
        },
        onError: (error) => {
            toast.error(t('error_updating_subcategory'))
            console.error('更新分类失败:', error)
        }
    })
    
    // 打开对话框时设置表单数据
    useEffect(() => {
        if (category && openDialog) {
            form.reset({
                name: category.name || '',
                description: category.description || '',
                color: category.color || '#6366F1',
                icon: category.icon || 'mdi:folder'
            });
        }
    }, [category, openDialog, form])
    
    const onSubmit = (data) => {
        // 如果分类名称已存在且不是当前分类，阻止提交并显示错误
        if (categoryExistsData?.exists) {
            form.setError('name', {
                type: 'manual',
                message: t('categoryAlreadyExists')
            });
            return;
        }
        
        if (!category) return;
        
        updateCategory({ 
            id: category.id, 
            data: data 
        });
    };
    
    // 暴露给父组件的函数
    useImperativeHandle(ref, () => ({
        open: (categoryData) => {
            setCategory(categoryData)
            setOpenDialog(true)
        }
    }))
    
    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('edit_category')}</DialogTitle>
                    <DialogDescription>
                        {t('edit_category_description')}
                    </DialogDescription>
                </DialogHeader>
                
                <Form {...form} className="space-y-4">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 左侧第一行: 分类名称 */}
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
                                            // 当输入分类名称时自动检查是否存在
                                            debouncedCheckCategoryName(e.target.value);
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
                        
                        {/* 右侧第一行: 颜色和图标 */}
                        <div className="space-y-4">
                            <div className="flex flex-row gap-4">
                                {/* 颜色选择器 */}
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

                                {/* 图标选择器 */}
                                <div className="w-28">
                                    <FormField
                                        control={form.control}
                                        name="icon"
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
                        
                        {/* 第二行: 描述 */}
                        <div className="md:col-span-2">
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
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" variant="orange" disabled={isUpdating || isCheckingCategoryName} onClick={form.handleSubmit(onSubmit)}>
                        {isUpdating ? t('updating') : t('update')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

EditCategoryDialog.displayName = 'EditCategoryDialog'

export default EditCategoryDialog
