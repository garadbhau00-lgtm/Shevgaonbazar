
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'नाव किमान २ अक्षरी असावे.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
    const { user, userProfile, loading, handleLogout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
        },
    });

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (userProfile) {
            form.reset({ name: userProfile.name || '' });
        }
    }, [user, userProfile, loading, router, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { name: data.name });
            toast({ title: 'यशस्वी', description: 'तुमचे प्रोफाइल यशस्वीरित्या अद्यतनित झाले आहे.' });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'प्रोफाइल अद्यतनित करण्यात अयशस्वी.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <div className="relative h-28 w-full">
                    <AppHeader />
                </div>
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }
    
    if (!user || !userProfile) return null;

    return (
        <div>
            <div className="relative h-28 w-full">
                <AppHeader />
                <Image
                    src="https://picsum.photos/seed/settings/1200/400"
                    alt="Settings background"
                    fill
                    className="object-cover"
                    data-ai-hint="gears settings"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">सेटिंग्ज</h1>
                    <p className="mt-2 text-xs max-w-xl">तुमची खाते माहिती व्यवस्थापित करा.</p>
                </div>
            </div>
            <main className="p-4">
                <Card className="mb-6">
                    <CardHeader className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100`} />
                            <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{userProfile.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>पूर्ण नाव</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isSubmitting} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormItem>
                                    <FormLabel>ईमेल</FormLabel>
                                    <Input value={user.email || ''} disabled readOnly />
                                </FormItem>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    बदल जतन करा
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 <Button variant="outline" className="w-full" onClick={handleLogout}>
                    लॉगआउट
                </Button>
            </main>
        </div>
    )
}
