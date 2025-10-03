
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDoc, collection, getDocs, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';


export default function BroadcastPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();
    
    const broadcastDict = dictionary.broadcast;

    const broadcastSchema = z.object({
        title: z.string().min(1, { message: broadcastDict.validation.titleRequired }),
        message: z.string().min(1, { message: broadcastDict.validation.messageRequired }),
    });

    type BroadcastFormValues = z.infer<typeof broadcastSchema>;

    const form = useForm<BroadcastFormValues>({
        resolver: zodResolver(broadcastSchema),
        defaultValues: { title: '', message: '' },
    });
    
    const { isSubmitting } = form.formState;

    useEffect(() => {
        if (!authLoading && userProfile?.role !== 'Admin') {
            toast({ variant: 'destructive', title: broadcastDict.accessDeniedTitle, description: broadcastDict.accessDeniedDescription });
            router.push('/more');
        }
    }, [authLoading, userProfile, router, toast, broadcastDict]);

    const onSubmit = async (data: BroadcastFormValues) => {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

            const batch = writeBatch(db);
            const timestamp = serverTimestamp();

            users.forEach(user => {
                const notificationRef = doc(collection(db, 'notifications'));
                batch.set(notificationRef, {
                    userId: user.uid,
                    title: data.title,
                    message: data.message,
                    isRead: false,
                    createdAt: timestamp,
                    type: 'broadcast'
                });
            });

            await batch.commit();
            toast({ title: broadcastDict.toast.successTitle, description: broadcastDict.toast.successDescription });
            form.reset();

        } catch (error) {
            console.error("Error sending broadcast:", error);
            toast({ variant: 'destructive', title: broadcastDict.toast.errorTitle, description: broadcastDict.toast.errorDescription });
        }
    };

    if (authLoading || userProfile?.role !== 'Admin') {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    return (
        <div>
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/broadcast/1200/400"
                    alt="Broadcast background"
                    fill
                    className="object-cover"
                    data-ai-hint="megaphone announcement"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{broadcastDict.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{broadcastDict.description}</p>
                </div>
            </div>
            <main className="p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{broadcastDict.messageTitleLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={broadcastDict.messageTitlePlaceholder} {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{broadcastDict.messageBodyLabel}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={broadcastDict.messageBodyPlaceholder}
                                            {...field}
                                            disabled={isSubmitting}
                                            rows={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {broadcastDict.sendButton}
                        </Button>
                    </form>
                </Form>
            </main>
        </div>
    );
}
