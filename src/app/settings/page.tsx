
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function SettingsPage() {
    const { user, userProfile, loading, handleLogout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const settingsDict = dictionary.settings;

    const profileSchema = z.object({
      name: z.string().min(2, { message: settingsDict.validation.nameMin }),
      mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: settingsDict.validation.mobileInvalid }).optional().or(z.literal('')),
    });
    
    type ProfileFormValues = z.infer<typeof profileSchema>;

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            mobileNumber: '',
        },
    });

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        if (userProfile) {
            form.reset({ 
                name: userProfile.name || '',
                mobileNumber: userProfile.mobileNumber || '',
            });
        }
    }, [user, userProfile, loading, router, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { 
                name: data.name,
                mobileNumber: data.mobileNumber
            });
            toast({ title: settingsDict.toast.updateSuccessTitle, description: settingsDict.toast.updateSuccessDescription });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({ variant: 'destructive', title: settingsDict.toast.errorTitle, description: settingsDict.toast.updateErrorDescription });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!user?.email) {
            toast({ variant: 'destructive', title: settingsDict.toast.errorTitle, description: settingsDict.toast.noEmailError });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: settingsDict.toast.resetEmailSentTitle,
                description: settingsDict.toast.resetEmailSentDescription,
            });
        } catch (error) {
            console.error('Error sending password reset email:', error);
             toast({
                variant: 'destructive',
                title: settingsDict.toast.errorTitle,
                description: settingsDict.toast.resetEmailError,
            });
        }
    }


    if (loading) {
        return (
            <>
                <div className="relative h-28 w-full">
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
                <Image
                    src="https://picsum.photos/seed/settings/1200/400"
                    alt="Settings background"
                    fill
                    className="object-cover"
                    data-ai-hint="gears settings"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{settingsDict.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{settingsDict.description}</p>
                </div>
            </div>
            <main className="p-4">
                <Card className="mb-6">
                    <CardHeader className="flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={userProfile.photoURL || `https://picsum.photos/seed/${user.uid}/100`} />
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
                                            <FormLabel>{settingsDict.fullNameLabel}</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={isSubmitting} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="mobileNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{settingsDict.mobileLabel}</FormLabel>
                                            <FormControl>
                                                <Input type="tel" {...field} disabled={isSubmitting} placeholder={settingsDict.mobilePlaceholder} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormItem>
                                    <FormLabel>{settingsDict.emailLabel}</FormLabel>
                                    <Input value={user.email || ''} disabled readOnly />
                                </FormItem>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {settingsDict.saveChangesButton}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                
                 <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">{settingsDict.securityTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">{settingsDict.passwordLabel}</p>
                            <p className="text-sm text-muted-foreground">{settingsDict.passwordDescription}</p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handlePasswordReset}>
                           {settingsDict.sendResetEmailButton}
                        </Button>
                    </CardContent>
                </Card>

                 <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                    {settingsDict.logoutButton}
                </Button>
            </main>
        </div>
    )
}
    