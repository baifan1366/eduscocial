'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function CreateBoardDialog({ children }) {
    const [openDialog, setOpenDialog] = useState(false);
    const t = useTranslations('Board');

    const form = useForm({
        resolver: zodResolver(
            z.object({
                boardName: z.string({
                    required_error: t('boardNameRequired'),
                    invalid_type_error: t('boardNameInvalidType'),
                }).min(1, {message: t('boardNameRequired')}).max(50, {message: t('boardNameMaxLength')}),
            })
        ),
        defaultValues: {
            boardName: '',
        }
    });

    //reset form
    useEffect(() => {
        form.reset();
    }, [openDialog]);

    const onSubmit = (data) => {
        console.log(data);
        toast.success('Board created successfully');
        setOpenDialog(false);
    };

    return (
        <>
            {children ? (
                <div onClick={() => setOpenDialog(true)}>
                    {children}
                </div>
            ) : (
                <Button onClick={() => setOpenDialog(true)}>
                    {t('createBoardButton')}
                </Button>
            )}
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-md text-muted-foreground">
                    <DialogHeader>
                        <DialogTitle>{t('createBoardTitle')}</DialogTitle>
                        <DialogDescription>{t('createBoardDescription')}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                                                maxLength={50}
                                            />
                                        </FormControl>
                                        <div className="flex justify-between mt-1">
                                            <FormMessage className="text-red-500 text-sm" />
                                            <span/>
                                            <span className="text-muted-foreground text-sm"> 
                                                {field.value?.trim().length || 0}/50
                                            </span>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" variant="orange" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
                            {t('createBoardButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Key Fields for a "Create Forum" Dialog
// Field	Type	Purpose
// Forum Name	Text Input	Display name (e.g., "感情")
// Slug / URL	Text Input	Used in the URL (e.g., love)
// Description	Textarea	Short intro or purpose
// Category Icon	Optional (select/upload)	Emoji/icon
// Visibility	Select (public / private / hidden)	Controls who can see it
// Allow Anonymous Posts?	Toggle	Dcard-style setting
// Enable Moderation?	Toggle	Flag/report system
// Create Button	Button	Trigger form submission