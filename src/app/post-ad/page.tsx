'use client';

import AdForm from './_components/ad-form';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

export default function PostAdPage() {
  const { dictionary } = useLanguage();
  return (
    <div>
      <div className="relative h-28 w-full">
        <AppHeader />
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
      </div>
      <main className="p-4">
        <AdForm />
      </main>
    </div>
  );
}
    