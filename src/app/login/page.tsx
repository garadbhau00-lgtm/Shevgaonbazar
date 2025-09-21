
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Leaf, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

const loginSchema = z.object({
  email: z.string().email({ message: 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' }),
  password: z.string().min(1, { message: 'पासवर्ड आवश्यक आहे.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading } = useAuth();
    
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const { isSubmitting } = form.formState;

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);


    async function onSubmit(data: LoginFormValues) {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast({
                title: "लॉगिन यशस्वी!",
                description: "शेवगाव बाजारमध्ये तुमचे स्वागत आहे.",
            });
            // The onAuthStateChanged listener in useAuth will handle the redirect.
        } catch (error) {
            toast({
                variant: "destructive",
                title: "लॉगिन अयशस्वी",
                description: "कृपया तुमचा ईमेल आणि पासवर्ड तपासा.",
            });
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    
    if (user) {
        return null; 
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Leaf className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">शेवगाव बाजारमध्ये लॉगिन करा</CardTitle>
                    <CardDescription>
                        तुमच्या खात्यात प्रवेश करण्यासाठी तुमची क्रेडेन्शियल्स प्रविष्ट करा
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ईमेल</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="तुमचा ईमेल पत्ता" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>पासवर्ड</FormLabel>
                                            <Link href="#" className="text-sm font-medium text-primary hover:underline">
                                                पासवर्ड विसरलात?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input type="password" placeholder="तुमचा पासवर्ड" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                लॉगिन करा
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-6 text-center text-sm">
                        खाते नाही?{' '}
                        <Link href="/signup" className="font-medium text-primary hover:underline">
                            साइन अप करा
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
