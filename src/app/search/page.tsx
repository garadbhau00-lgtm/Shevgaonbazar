
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/contexts/language-context';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function SearchPage() {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const searchDict = dictionary.search;

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
        collection(db, 'ads'), 
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
        setAds(adsData);
        setLoading(false);
    }, (error: any) => {
        console.error("Error fetching ads for search: ", error);
        toast({
            variant: 'destructive',
            title: searchDict.errorTitle,
            description: searchDict.errorDescription,
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, searchDict]);

  const filteredAds = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return ads.filter(ad => 
      (dictionary.categories[ad.category] || ad.category).toLowerCase().includes(lowercasedTerm) ||
      (ad.subcategory && (dictionary.subcategories[ad.subcategory.toLowerCase().replace(/ /g, '_')] || ad.subcategory).toLowerCase().includes(lowercasedTerm)) ||
      (ad.description && ad.description.toLowerCase().includes(lowercasedTerm)) ||
      ad.location.toLowerCase().includes(lowercasedTerm)
    );
  }, [ads, searchTerm, dictionary]);

  return (
    <div className="flex flex-col h-full">
       <header className="sticky top-0 z-10">
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/search-page/1200/400"
                    alt="Search background"
                    fill
                    className="object-cover"
                    data-ai-hint="magnifying glass map"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{searchDict.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{searchDict.description}</p>
                </div>
            </div>
             <div className="p-4 bg-background border-b">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder={searchDict.placeholder}
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </header>

      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">{searchDict.loading}</p>
            </div>
        ) : !searchTerm.trim() ? (
             <div className="flex h-64 flex-col items-center justify-center text-center p-4 rounded-lg border-2 border-dashed">
                <SearchIcon className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-semibold text-muted-foreground">
                    {searchDict.initialStateTitle}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                   {searchDict.initialStateDescription}
                </p>
            </div>
        ) : filteredAds.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="text-lg font-semibold text-muted-foreground">{searchDict.noResultsTitle}</p>
                <p className="text-sm text-muted-foreground">{searchDict.noResultsDescription}</p>
            </div>
        )}
      </main>
    </div>
  );
}

