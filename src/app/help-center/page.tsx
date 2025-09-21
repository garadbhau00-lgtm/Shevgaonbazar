
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';

const faqs = [
    {
        question: "जाहिरात कशी पोस्ट करावी?",
        answer: "नवीन जाहिरात पोस्ट करण्यासाठी, होम स्क्रीनवरील 'जाहिरात टाका' बटणावर टॅप करा. त्यानंतर, तुमची श्रेणी निवडा, आवश्यक माहिती भरा, फोटो अपलोड करा आणि 'पोस्ट करा' बटणावर क्लिक करा. तुमची जाहिरात समीक्षेसाठी पाठवली जाईल."
    },
    {
        question: "माझी जाहिरात का नाकारली गेली?",
        answer: "तुमची जाहिरात अनेक कारणांमुळे नाकारली जाऊ शकते, जसे की अस्पष्ट फोटो, चुकीची माहिती किंवा आमच्या मार्गदर्शक तत्त्वांचे उल्लंघन. 'माझ्या जाहिराती' विभागात तुम्हाला नाकारण्याचे विशिष्ट कारण दिसेल."
    },
    {
        question: "मी माझा पासवर्ड कसा बदलू शकतो?",
        answer: "सध्या, प्रोफाइलमधून थेट पासवर्ड बदलण्याची सुविधा उपलब्ध नाही. पासवर्ड रीसेट करण्यासाठी, कृपया लॉगआउट करा आणि लॉगिन पेजवरील 'पासवर्ड विसरलात?' लिंक वापरा."
    },
    {
        question: "एखाद्या वस्तूसाठी मी विक्रेत्याशी संपर्क कसा साधू?",
        answer: "जाहिरातीच्या तपशील पेजवर, तुम्हाला विक्रेत्याशी संपर्क साधण्यासाठी 'कॉल करा' बटण दिसेल. या बटणावर टॅप करून तुम्ही थेट विक्रेत्याला कॉल करू शकता."
    }
];


export default function HelpCenterPage() {
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
                    <h1 className="text-lg font-bold">मदत केंद्र</h1>
                    <p className="mt-2 text-xs max-w-xl">तुम्हाला असलेले प्रश्न आणि त्यांची उत्तरे येथे शोधा.</p>
                </div>
            </div>
            <main className="p-4">
                 <Accordion type="single" collapsible className="w-full space-y-2">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="rounded-lg bg-card px-4 shadow-sm">
                            <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </main>
        </div>
    )
}
