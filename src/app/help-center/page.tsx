'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HelpCenterPage() {
    const { dictionary } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    const faqs = dictionary.helpCenter.faqs;

    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMessageSubmit = async () => {
        if (!message.trim()) {
            toast({
                variant: 'destructive',
                title: 'Message is empty',
                description: 'Please write a message before sending.'
            });
            return;
        }

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not logged in',
                description: 'You must be logged in to send a message.'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'help_messages'), {
                userId: user.uid,
                userEmail: user.email,
                message: message.trim(),
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Message Sent!',
                description: 'An admin will get back to you shortly.'
            });
            setMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send message. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
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

                {user && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Send a Message</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Textarea
                                    placeholder="Write your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                />
                                <Button onClick={handleMessageSubmit} disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Message
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="rounded-lg bg-card p-6 text-center shadow-sm">
                    <h3 className="text-lg font-semibold">{dictionary.helpCenter.moreHelpTitle}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {dictionary.helpCenter.moreHelpDescription}
                    </p>
                    <a href="mailto:support@shevgavbazar.com" className="mt-4 inline-block font-semibold text-primary hover:underline">
                        support@shevgavbazar.com
                    </a>
                </div>

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
    