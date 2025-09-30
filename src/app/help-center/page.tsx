'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-context';

export default function HelpCenterPage() {
    const { dictionary } = useLanguage();
    const faqs = dictionary.helpCenter.faqs;

    return (
        <div>
            <div className="relative h-28 w-full">
                <AppHeader />
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
            <main className="p-4">
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

                <div className="mt-8 rounded-lg bg-card p-6 text-center shadow-sm">
                    <h3 className="text-lg font-semibold">{dictionary.helpCenter.moreHelpTitle}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {dictionary.helpCenter.moreHelpDescription}
                    </p>
                    <a href="mailto:support@shevgavbazar.com" className="mt-4 inline-block font-semibold text-primary hover:underline">
                        support@shevgavbazar.com
                    </a>
                </div>

                <div className="mt-8 text-center text-xs text-muted-foreground">
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
    