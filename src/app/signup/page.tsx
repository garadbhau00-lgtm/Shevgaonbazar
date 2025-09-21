
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Leaf, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

const signupSchema = z.object({
    name: z.string().min(2, { message: 'नाव आवश्यक आहे.' }),
    email: z.string().email({ message: 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' }),
    password: z.string().min(6, { message: 'पासवर्ड किमान ६ वर्णांचा असावा.' }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "पासवर्ड जुळत नाहीत.",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;


export default function SignupPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading } = useAuth();
    
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });
    
    const { isSubmitting } = form.formState;

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);


    async function onSubmit(data: SignupFormValues) {
        let newUser;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            newUser = userCredential.user;
            
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                email: newUser.email,
                name: data.name,
                role: 'Farmer',
                disabled: false,
                createdAt: serverTimestamp(),
            });

            toast({
                title: "Sign in successfully.",
            });
            
        } catch (error: any) {
            if (newUser) {
                await signOut(auth);
            }
            
            let message = "खाते तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.";
            if (error.code === 'auth/email-already-in-use') {
                message = "हा ईमेल पत्ता आधीच वापरलेला आहे.";
            } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
                message = "डेटाबेसमध्ये प्रोफाइल तयार करण्यासाठी परवानगी नाही. कृपया तुमचे फायरस्टोअर नियम तपासा.";
            }
            
            toast({
                variant: "destructive",
                title: "त्रुटी!",
                description: message,
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
        <div className="flex min-h-screen items-center justify-center bg-secondary/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Leaf className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">नवीन खाते तयार करा</CardTitle>
                    <CardDescription>
                        प्रारंभ करण्यासाठी तुमची माहिती प्रविष्ट करा
                    </CardDescription>
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
                                            <Input placeholder="तुमचे पूर्ण नाव" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                        <FormLabel>पासवर्ड</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="तुमचा पासवर्ड" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>पासवर्डची पुष्टी करा</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="पासवर्डची पुष्टी करा" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               खाते तयार करा
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 text-center text-sm">
                        आधीपासूनच खाते आहे?{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            लॉगिन करा
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
