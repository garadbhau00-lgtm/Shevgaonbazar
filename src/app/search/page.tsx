'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search as SearchIcon, X, ArrowLeft } from 'lucide-react';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

function AdList({ ads, loading }: { ads: Ad[]; loading: boolean }) {
  const { dictionary } = useLanguage();
  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">{dictionary.search.loading}</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center p-4">
         <SearchIcon className="h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-semibold text-muted-foreground">
          {dictionary.search.noResultsTitle}
        </p>
        <p className="text-sm text-muted-foreground">
          {dictionary.search.noResultsDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
        collection(db, 'ads'), 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
        setAllAds(adsData);
        setAdsLoading(false);
    }, (error: any) => {
        console.error("Error fetching ads: ", error);
        toast({
            variant: 'destructive',
            title: dictionary.search.errorTitle,
            description: dictionary.search.errorDescription
        });
        setAdsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, dictionary]);
  
  const filteredAds = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return allAds.filter(ad => 
        (ad.title && ad.title.toLowerCase().includes(lowercasedTerm)) ||
        (ad.category && ad.category.toLowerCase().includes(lowercasedTerm)) ||
        (ad.subcategory && ad.subcategory.toLowerCase().includes(lowercasedTerm)) ||
        (ad.location && ad.location.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, allAds]);
  
  const showInitialState = searchTerm.length === 0;

  return (
    <div>
      <div className="relative h-28 w-full">
        <Image
          src="https://picsum.photos/seed/search-page/1200/400"
          alt="Search page background"
          fill
          className="object-cover"
          data-ai-hint="magnifying glass farm"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
          <h1 className="text-lg font-bold">{dictionary.search.title}</h1>
          <p className="mt-2 text-xs max-w-xl">{dictionary.search.description}</p>
        </div>
      </div>
      <header className="sticky top-0 z-20 bg-background p-2 border-b">
         <div className="flex items-center gap-2">
            <div className="relative w-full">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={dictionary.search.placeholder}
                className="w-full rounded-lg bg-secondary pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-muted-foreground">
                    <X className="h-4 w-4" />
                </button>
              )}
            </div>
         </div>
      </header>

      <main className="p-4">
        {showInitialState ? (
             <div className="flex h-64 flex-col items-center justify-center text-center p-4">
                <SearchIcon className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-semibold text-muted-foreground">
                    {dictionary.search.initialStateTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                    {dictionary.search.initialStateDescription}
                </p>
            </div>
        ) : (
             <AdList ads={filteredAds} loading={adsLoading} />
        )}
      </main>
    </div>
  );
}
    