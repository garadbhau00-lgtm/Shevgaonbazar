
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Leaf, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';


const loginSchema = z.object({
  email: z.string().email({ message: 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' }),
  password: z.string().min(1, { message: 'पासवर्ड आवश्यक आहे.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="mr-2">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.355-11.024-7.944l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
  " />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.345,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading, handleGoogleSignIn } = useAuth();
    const { dictionary } = useLanguage();
    const loginDict = dictionary.login;

    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [popupShown, setPopupShown] = useState(false);
    
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
    
    useEffect(() => {
        if (!loading && !user && !popupShown) {
            handleGoogleSignIn();
            setPopupShown(true);
        }
    }, [loading, user, popupShown, handleGoogleSignIn]);


    async function onSubmit(data: LoginFormValues) {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast({
                title: loginDict.toast.loginSuccessTitle,
                description: loginDict.toast.welcome,
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: loginDict.toast.loginFailedTitle,
                description: loginDict.toast.loginFailedDescription,
            });
        }
    }
    
    const handlePasswordReset = async () => {
        if (!resetEmail) {
            toast({ variant: 'destructive', title: loginDict.toast.errorTitle, description: loginDict.toast.emailRequired });
            return;
        }
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast({ title: loginDict.toast.resetEmailSentTitle, description: loginDict.toast.resetEmailSentDescription });
            setIsResetDialogOpen(false);
            setResetEmail('');
        } catch (error: any) {
            let description = loginDict.toast.resetEmailError;
            if (error.code === 'auth/user-not-found') {
                description = loginDict.toast.userNotFound;
            }
            toast({ variant: 'destructive', title: loginDict.toast.errorTitle, description });
        } finally {
            setIsSendingReset(false);
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
                    <CardTitle className="text-2xl">{loginDict.title}</CardTitle>
                    <CardDescription>
                        {loginDict.description}
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
                                        <FormLabel>{loginDict.emailLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder={loginDict.emailPlaceholder} {...field} />
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
                                            <FormLabel>{loginDict.passwordLabel}</FormLabel>
                                            <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="link" type="button" className="p-0 h-auto text-sm font-medium text-primary hover:underline">
                                                        {loginDict.forgotPassword}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{loginDict.resetPassword.title}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                           {loginDict.resetPassword.description}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="reset-email">{loginDict.resetPassword.emailLabel}</Label>
                                                        <Input 
                                                            id="reset-email" 
                                                            type="email" 
                                                            placeholder={loginDict.emailPlaceholder}
                                                            value={resetEmail}
                                                            onChange={(e) => setResetEmail(e.target.value)}
                                                            disabled={isSendingReset}
                                                        />
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel disabled={isSendingReset}>{loginDict.resetPassword.cancelButton}</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handlePasswordReset} disabled={isSendingReset}>
                                                             {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            {loginDict.resetPassword.sendButton}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <FormControl>
                                            <Input type="password" placeholder={loginDict.passwordPlaceholder} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loginDict.loginButton}
                            </Button>
                        </form>
                    </Form>
                     <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {loginDict.or}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                        <GoogleIcon />
                        {loginDict.loginWithGoogle}
                    </Button>
                    <div className="mt-6 text-center text-sm">
                        {loginDict.noAccount}{' '}
                        <Link href="/signup" className="font-medium text-primary hover:underline">
                            {loginDict.signupLink}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


    