
'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ad } from '@/lib/types';
import AdCard from '@/components/ad-card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const categories = ['सर्व', 'पशुधन', 'शेती उत्पादन', 'उपकरणे'];

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
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);

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
    }, (error) => {
        console.error("Error fetching ads: ", error);
        setAdsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const livestockAds = ads.filter((ad) => ad.category === 'पशुधन');
  const produceAds = ads.filter((ad) => ad.category === 'शेती उत्पादन');
  const equipmentAds = ads.filter((ad) => ad.category === 'उपकरणे');

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

  const renderUserOptions = () => {
    if (authLoading) {
      return <Loader2 className="h-6 w-6 animate-spin" />;
    }
    if (user && userProfile) {
       return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-8 w-8 cursor-pointer">
                  {user.photoURL && <AvatarImage src={user.photoURL} />}
                  <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>{userProfile.name || userProfile.email}</p>
                {userProfile.name && <p className="text-xs text-muted-foreground font-normal">{userProfile.email}</p>}
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
        <Button asChild variant="outline">
            <Link href="/login">लॉगिन करा</Link>
        </Button>
    );
  }

  return (
    <div>
      <header className="bg-card p-4 pb-0">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">शेवगाव बाजार</h1>
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">सूचना</span>
                </Button>
                {renderUserOptions()}
            </div>
        </div>
        <div className="mt-2 text-center">
            <p className="text-lg font-bold">शेवगाव बाजार मध्ये आपले स्वागत आहे</p>
            <p className="text-sm text-muted-foreground">तुमच्या स्थानिक शेतकरी समुदायाचे ह्रदय...</p>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="जाहिरात शोधा..." className="pl-10" />
        </div>
      </header>

      <main className="p-4">
        <Tabs defaultValue="सर्व" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="सर्व" className="mt-4">
            <AdList ads={ads} loading={adsLoading} />
          </TabsContent>
          <TabsContent value="पशुधन" className="mt-4">
            <AdList ads={livestockAds} loading={adsLoading} />
          </TabsContent>
          <TabsContent value="शेती उत्पादन" className="mt-4">
            <AdList ads={produceAds} loading={adsLoading} />
          </TabsContent>
          <TabsContent value="उपकरणे" className="mt-4">
            <AdList ads={equipmentAds} loading={adsLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
