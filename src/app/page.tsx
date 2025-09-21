
'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogOut, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { categories } from '@/lib/categories';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

function AdList({ ads, loading }: { ads: Ad[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">जाहिराती लोड होत आहेत...</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          कोणत्याही जाहिराती आढळल्या नाहीत.
        </p>
        <p className="text-sm text-muted-foreground">
          या वर्गात सध्या कोणत्याही जाहिराती नाहीत.
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

export default function Home() {
  const { user, userProfile, loading: authLoading, handleLogout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('सर्व');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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


  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

  const renderUserOptions = () => {
    if (!isClient || authLoading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (user && userProfile) {
       return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-8 w-8 cursor-pointer">
                  {user.photoURL && <AvatarImage src={user.photoURL} />}
                  <AvatarFallback className="font-bold bg-black text-white">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>{userProfile.name || user.email}</p>
                {userProfile.name && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/my-ads')}>
                माझ्या जाहिराती
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/more')}>
                More Options
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>लॉगआउट</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      );
    }
    return (
        <Button asChild variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white">
            <Link href="/login">लॉगिन करा</Link>
        </Button>
    );
  }

  return (
    <div>
       <header className="sticky top-0 z-20 bg-card">
        <div className="relative w-full h-24 text-white">
            <Image
                src="https://picsum.photos/seed/header/1200/300"
                alt="Header background"
                fill
                className="object-cover"
                data-ai-hint="green forest"
            />
            <div className="absolute top-2 right-2 z-10">
                {renderUserOptions()}
            </div>
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                 <div className='space-y-1'>
                    <h2 className="text-sm font-bold">शेवगाव बाजार मध्ये आपले स्वागत आहे</h2>
                    <p className="text-xs max-w-md">तुमच्या स्थानिक शेतकरी समुदायाचे हृदय. तुमच्या तालुक्यात उत्पादन, पशुधन आणि उपकरणे खरेदी आणि विक्री करा.</p>
                </div>
            </div>
        </div>
      </header>
      
      <main>
        <div className="sticky top-[96px] z-20 bg-background/95 backdrop-blur-sm p-4 pt-2 pb-2">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex w-max gap-2 bg-transparent p-0">
                <TabsTrigger value="सर्व" className="h-auto flex flex-col gap-1.5 p-2 text-[11px] rounded-lg">
                  <List className="h-4 w-4" />
                  सर्व
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.name}
                    value={category.name}
                    className="h-auto flex flex-col gap-1.5 p-2 text-[11px] rounded-lg"
                  >
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
            </Tabs>
        </div>
        <div className="p-4">
          <AdList ads={filteredAds} loading={adsLoading} />
        </div>
      </main>
    </div>
  );
}
