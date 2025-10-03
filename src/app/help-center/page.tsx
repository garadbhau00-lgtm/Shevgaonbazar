
'use client';

import { useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export default function HelpCenterPage() {
    const { dictionary } = useLanguage();
    const faqs = dictionary.helpCenter.faqs;
    const { user, userProfile, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const issueDict = dictionary.helpCenter.issueForm;

    const issueSchema = z.object({
        name: z.string().min(1, { message: issueDict.validation.nameRequired }),
        email: z.string().email({ message: issueDict.validation.emailRequired }),
        description: z.string().min(10, { message: issueDict.validation.descriptionRequired }),
    });

    type IssueFormValues = z.infer<typeof issueSchema>;

    const form = useForm<IssueFormValues>({
        resolver: zodResolver(issueSchema),
        defaultValues: {
            name: '',
            email: '',
            description: '',
        },
    });

    const { isSubmitting } = form.formState;

    useEffect(() => {
        if (user && userProfile) {
            form.setValue('name', userProfile.name || '');
            form.setValue('email', user.email || '');
        }
    }, [user, userProfile, form]);

    const onSubmit = async (data: IssueFormValues) => {
        const issueData = {
            ...data,
            userId: user?.uid || null,
            status: 'new' as const,
            createdAt: serverTimestamp(),
        };

        const issuesCollection = collection(db, 'issues');
        addDoc(issuesCollection, issueData)
          .then(() => {
            toast({
                title: issueDict.toast.successTitle,
                description: issueDict.toast.successDescription,
            });
            form.reset({
                name: user && userProfile ? userProfile.name || '' : '',
                email: user ? user.email || '' : '',
                description: '',
            });
          })
          .catch((serverError) => {
            console.error('Error submitting issue:', serverError);
            const permissionError = new FirestorePermissionError({
                path: issuesCollection.path,
                operation: 'create',
                requestResourceData: issueData
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };


    return (
        <div>
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/help-center/1200/400"
                    alt="Help Center background"
                    fill
                    className="object-cover"
                    data-ai-hint="support customer service"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{dictionary.helpCenter.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{dictionary.helpCenter.description}</p>
                </div>
            </div>
            <main className="p-4 space-y-8">
                 <Accordion type="single" collapsible className="w-full space-y-2">
                    {faqs.map((faq: { question: string, answer: string }, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`} className="rounded-lg bg-card px-4 shadow-sm">
                            <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <Card>
                    <CardHeader>
                        <CardTitle>{issueDict.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{issueDict.nameLabel}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder={issueDict.namePlaceholder} disabled={isSubmitting || authLoading} />
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
                                                <FormLabel>{issueDict.emailLabel}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder={issueDict.emailPlaceholder} disabled={isSubmitting || authLoading} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{issueDict.descriptionLabel}</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder={issueDict.descriptionPlaceholder} rows={5} disabled={isSubmitting} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {issueDict.submitButton}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="text-center text-xs text-muted-foreground">
                    <Link href="#" className="hover:underline">
                        {dictionary.helpCenter.termsOfService}
                    </Link>
                    <Separator orientation="vertical" className="mx-2 h-3 inline-block" />
                    <Link href="#" className="hover:underline">
                        {dictionary.helpCenter.privacyPolicy}
                    </Link>
                </div>
            </main>
        </div>
    )
}
