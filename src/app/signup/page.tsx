
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
import { useLanguage } from '@/contexts/language-context';

const signupSchema = z.object({
    name: z.string().min(2, { message: 'नाव आवश्यक आहे.' }),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: 'कृपया वैध १०-अंकी मोबाईल नंबर टाका.' }),
    email: z.string().email({ message: 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' }),
    password: z.string().min(6, { message: 'पासवर्ड किमान ६ वर्णांचा असावा.' }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "पासवर्ड जुळत नाहीत.",
    path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="mr-2">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.355-11.024-7.944l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
  " />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.345,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

export default function SignupPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading, handleGoogleSignIn } = useAuth();
    const { dictionary } = useLanguage();
    
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            mobileNumber: '',
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
                mobileNumber: data.mobileNumber,
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
                    <CardTitle className="text-2xl">{dictionary.signup.title}</CardTitle>
                    <CardDescription>
                        {dictionary.signup.description}
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
                                        <FormLabel>{dictionary.signup.nameLabel}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={dictionary.signup.namePlaceholder} {...field} />
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
                                        <FormLabel>{dictionary.signup.mobileLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder={dictionary.signup.mobilePlaceholder} {...field} />
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
                                        <FormLabel>{dictionary.signup.emailLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder={dictionary.signup.emailPlaceholder} {...field} />
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
                                        <FormLabel>{dictionary.signup.passwordLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={dictionary.signup.passwordPlaceholder} {...field} />
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
                                        <FormLabel>{dictionary.signup.confirmPasswordLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={dictionary.signup.confirmPasswordPlaceholder} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {dictionary.signup.signupButton}
                            </Button>
                        </form>
                    </Form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {dictionary.signup.or}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                        <GoogleIcon />
                        {dictionary.signup.signupWithGoogle}
                    </Button>

                    <div className="mt-6 text-center text-sm">
                        {dictionary.signup.haveAccount}{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            {dictionary.signup.loginLink}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
