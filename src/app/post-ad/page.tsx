'use client';

import { useState } from 'react';
import AdForm from './_components/ad-form';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, FilePlus2 } from 'lucide-react';
import BusinessForm from './_components/business-form';

type ViewState = 'options' | 'adForm' | 'businessForm';

export default function PostAdPage() {
  const { dictionary } = useLanguage();
  const [view, setView] = useState<ViewState>('options');

  const getTitle = () => {
    switch(view) {
        case 'adForm':
            return dictionary.postAd.title;
        case 'businessForm':
            return 'तुमचा व्यवसाय नोंदवा';
        case 'options':
        default:
             return 'तुम्ही काय करू इच्छिता?';
    }
  }

  const getDescription = () => {
     switch(view) {
        case 'adForm':
            return dictionary.postAd.description;
        case 'businessForm':
            return 'तुमच्या सेवेची माहिती भरा आणि अधिक ग्राहकांपर्यंत पोहोचा.';
        case 'options':
        default:
             return 'एक पर्याय निवडा';
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10">
        <div className="relative h-28 w-full">
          <Image
            src="https://picsum.photos/seed/post-ad/1200/400"
            alt="Post ad background"
            fill
            className="object-cover"
            data-ai-hint="farm produce"
          />
          <div className="absolute inset-0 bg-black/50" />
           <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
               {view !== 'options' && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 left-2 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => setView('options')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-lg font-bold">{getTitle()}</h1>
              <p className="mt-2 text-xs max-w-xl">{getDescription()}</p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        {view === 'options' && (
            <div className="flex items-center justify-center h-full gap-2">
                 <Button 
                    className="w-full max-w-xs h-32 flex flex-col items-center justify-center gap-2 text-base"
                    onClick={() => setView('adForm')}
                >
                     <FilePlus2 className="h-8 w-8"/>
                    <span>जाहिरात टाका</span>
                </Button>
                
                 <Button 
                    className="w-full max-w-xs h-32 flex flex-col items-center justify-center gap-2 text-base"
                    onClick={() => setView('businessForm')}
                >
                    <Briefcase className="h-8 w-8"/>
                    <span>व्यवसाय नोंदवा</span>
                </Button>
            </div>
        )}
        {view === 'adForm' && <AdForm key="ad" />}
        {view === 'businessForm' && <BusinessForm key="business" />}
      </main>
    </div>
  );
}
