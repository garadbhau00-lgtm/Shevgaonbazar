
'use client';

import { useEffect, useState } from 'react';
import { Loader2, List, Search as SearchIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { categories } from '@/lib/categories';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

function AdList({ ads, loading }: { ads: Ad[]; loading: boolean }) {
  const { dictionary } = useLanguage();
  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">{dictionary.home.loadingAds}</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          {dictionary.home.noAdsFound}
        </p>
        <p className="text-sm text-muted-foreground">
          {dictionary.home.noAdsInCategory}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('सर्व');

  useEffect(() => {
    const q = query(
        collection(db, 'ads'), 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
        setAds(adsData);
        setAdsLoading(false);
    }, (error: any) => {
        console.error("Error fetching ads: ", error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          toast({
            variant: 'destructive',
            title: 'डेटाबेस त्रुटी: इंडेक्स आवश्यक',
            description: 'जाहिराती आणण्यासाठी फायरस्टोअर इंडेक्स आवश्यक आहे. कृपया फायरबेस कन्सोलमध्ये इंडेक्स तयार करा.',
            duration: 10000,
          })
        } else {
           toast({
            variant: 'destructive',
            title: 'त्रुटी',
            description: 'जाहिराती आणण्यात अयशस्वी.'
           })
        }
        setAdsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const filteredAds = selectedCategory === 'सर्व'
    ? ads
    : ads.filter(ad => ad.category === selectedCategory);

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-20">
        <div className="relative h-28 w-full">
          <Image
              src="https://picsum.photos/seed/header/1200/400"
              alt="Header background"
              fill
              className="object-cover"
              data-ai-hint="farm landscape"
              priority
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
              <h1 className="text-lg font-bold">{dictionary.home.welcomeTitle}</h1>
              <p className="mt-2 text-xs max-w-xl">{dictionary.home.welcomeDescription}</p>
          </div>
        </div>
         <div className="bg-background/95 backdrop-blur-sm border-b">
           <div className="w-full overflow-x-auto p-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
             <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="inline-flex w-max gap-2 bg-transparent p-0">
                    <TabsTrigger value="सर्व" className="h-auto flex flex-col items-center justify-center gap-1 p-2 text-xs rounded-lg border data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <List className="h-4 w-4" />
                      <span>{dictionary.home.all}</span>
                    </TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger
                        key={category.name}
                        value={category.name}
                        className="h-auto flex flex-col items-center justify-center gap-1 p-2 text-xs rounded-lg border data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                      >
                        <category.icon className="h-4 w-4" />
                        <span>{dictionary.categories[category.name] || category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
              </Tabs>
            </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4">
          <AdList ads={filteredAds} loading={adsLoading} />
        </div>
      </main>
    </div>
  );
}
