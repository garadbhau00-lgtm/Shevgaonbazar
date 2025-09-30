
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Loader2, List, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { categories } from '@/lib/categories';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { Select as DropdownSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { villageList } from '@/lib/villages';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


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

type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc';

const MAX_PRICE_LIMIT = 500000;

export default function Home() {
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('सर्व');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE_LIMIT);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const sortOptions: { value: SortOption, label: string }[] = [
    { value: 'newest', label: dictionary.home.sortOptions.newest },
    { value: 'oldest', label: dictionary.home.sortOptions.oldest },
    { value: 'price-asc', label: dictionary.home.sortOptions.priceAsc },
    { value: 'price-desc', label: dictionary.home.sortOptions.priceDesc },
  ];

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
            title: dictionary.home.dbError.title,
            description: dictionary.home.dbError.description,
            duration: 10000,
          })
        } else {
           toast({
            variant: 'destructive',
            title: dictionary.home.fetchError.title,
            description: dictionary.home.fetchError.description,
           })
        }
        setAdsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, dictionary]);
  
  const sortedAndFilteredAds = useMemo(() => {
    let filtered = ads;

    if (selectedCategory !== 'सर्व') {
      filtered = filtered.filter(ad => ad.category === selectedCategory);
    }
    
    if (selectedSubcategory !== 'all') {
      filtered = filtered.filter(ad => ad.subcategory === selectedSubcategory);
    }

    if(selectedVillage !== 'all') {
      filtered = filtered.filter(ad => ad.location === selectedVillage);
    }
    
    filtered = filtered.filter(ad => ad.price <= maxPrice);

    switch (sortOption) {
      case 'newest':
        return filtered.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      case 'oldest':
        return filtered.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
      case 'price-asc':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return filtered.sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  }, [ads, selectedCategory, selectedSubcategory, sortOption, selectedVillage, maxPrice]);

  useEffect(() => {
    // Reset subcategory when main category changes
    setSelectedSubcategory('all');
  }, [selectedCategory]);
  
  const subcategoriesForSelectedCategory = useMemo(() => {
    if (selectedCategory === 'सर्व') return [];
    const categoryData = categories.find(cat => cat.name === selectedCategory);
    return categoryData?.subcategories || [];
  }, [selectedCategory]);

  const resetFilters = () => {
    setSortOption('newest');
    setSelectedVillage('all');
    setMaxPrice(MAX_PRICE_LIMIT);
    setSelectedSubcategory('all');
  }
  
  const activeFilterCount =
    (sortOption !== 'newest' ? 1 : 0) +
    (selectedVillage !== 'all' ? 1 : 0) +
    (maxPrice < MAX_PRICE_LIMIT ? 1 : 0) +
    (selectedSubcategory !== 'all' ? 1 : 0);


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
          <div className="absolute bottom-2 right-2">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-auto py-1 px-2 text-xs bg-background/80 hover:bg-background">
                          <Filter className="h-4 w-4 mr-2" />
                          <span>{dictionary.home.filterSort.button}</span>
                          {activeFilterCount > 0 && (
                            <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                              {activeFilterCount}
                            </span>
                          )}
                      </Button>
                  </SheetTrigger>
                  <SheetContent>
                      <SheetHeader>
                          <SheetTitle>{dictionary.home.filterSort.title}</SheetTitle>
                      </SheetHeader>
                      <div className="py-4 space-y-6 overflow-y-auto h-[calc(100vh-10rem)] pr-4">
                           <div>
                              <Label className="text-base font-semibold">{dictionary.home.filterSort.sortBy}</Label>
                              <RadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)} className="mt-2 space-y-1">
                                {sortOptions.map(option => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
                                    <Label htmlFor={`sort-${option.value}`} className="font-normal">{option.label}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                          </div>
                          
                          {subcategoriesForSelectedCategory.length > 0 && (
                            <div>
                                <Label htmlFor="subcategory-filter" className="text-base font-semibold">{dictionary.home.filterSort.subcategory}</Label>
                                <DropdownSelect value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                                    <SelectTrigger id="subcategory-filter" className="mt-2">
                                        <SelectValue placeholder={dictionary.home.filterSort.selectSubcategory} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{dictionary.home.filterSort.allSubcategories}</SelectItem>
                                        {subcategoriesForSelectedCategory.map(subcat => (
                                            <SelectItem key={subcat.key} value={subcat.name}>
                                                {dictionary.subcategories[subcat.key] || subcat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </DropdownSelect>
                           </div>
                          )}

                           <div>
                                <Label htmlFor="village-filter" className="text-base font-semibold">{dictionary.home.filterSort.village}</Label>
                                <DropdownSelect value={selectedVillage} onValueChange={setSelectedVillage}>
                                    <SelectTrigger id="village-filter" className="mt-2">
                                        <SelectValue placeholder={dictionary.home.filterSort.selectVillage} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{dictionary.home.filterSort.allVillages}</SelectItem>
                                        {villageList.map(village => (
                                            <SelectItem key={village} value={village}>{village}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </DropdownSelect>
                           </div>

                           <div>
                                <div className="flex justify-between items-center mb-2">
                                     <Label className="text-base font-semibold">{dictionary.home.filterSort.maxPrice}</Label>
                                     <span className="text-sm font-medium text-primary">
                                        ₹{maxPrice.toLocaleString('en-IN')}
                                     </span>
                                </div>
                                <Slider
                                    value={[maxPrice]}
                                    onValueChange={(value) => setMaxPrice(value[0])}
                                    max={MAX_PRICE_LIMIT}
                                    step={1000}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>₹0</span>
                                    <span>₹{MAX_PRICE_LIMIT.toLocaleString('en-IN')}</span>
                                </div>
                           </div>
                      </div>
                       <SheetFooter className="mt-6 flex-col-reverse sm:flex-row gap-2 absolute bottom-0 right-0 left-0 p-6 bg-background border-t">
                          <Button variant="outline" onClick={resetFilters} className="w-full">{dictionary.home.filterSort.clearButton}</Button>
                          <Button onClick={() => setIsFilterSheetOpen(false)} className="w-full">{dictionary.home.filterSort.applyButton}</Button>
                      </SheetFooter>
                  </SheetContent>
              </Sheet>
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
          <AdList ads={sortedAndFilteredAds} loading={adsLoading} />
        </div>
      </main>
    </div>
  );
}
