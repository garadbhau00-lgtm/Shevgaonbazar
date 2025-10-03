
'use client';

import { useState } from 'react';
import AdForm from './_components/ad-form';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import type { Ad } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

export default function PostAdPage() {
  const { dictionary } = useLanguage();
  const [defaultCategory, setDefaultCategory] = useState<Ad['category'] | undefined>();
  const [formKey, setFormKey] = useState(Date.now());

  const handleRegisterBusinessClick = () => {
    setDefaultCategory('व्यावसायिक सेवा');
    setFormKey(Date.now()); // Re-mount the form with the new default prop
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
              <h1 className="text-lg font-bold">{dictionary.postAd.title}</h1>
              <p className="mt-2 text-xs max-w-xl">{dictionary.postAd.description}</p>
          </div>
           <div className="absolute bottom-[-1.2rem] w-full flex justify-center">
              <Button onClick={handleRegisterBusinessClick} className="shadow-lg">
                <Briefcase className="mr-2 h-4 w-4"/>
                तुमचा व्यवसाय नोंदवा
              </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 pt-10">
        <AdForm key={formKey} defaultCategory={defaultCategory} />
      </main>
    </div>
  );
}

    