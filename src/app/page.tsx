
'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Ad } from '@/lib/types';
import { mockAds } from '@/lib/data';
import AdCard from '@/components/ad-card';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

const categories = ['सर्व', 'पशुधन', 'शेती उत्पादन', 'उपकरणे'];

function AdList({ ads }: { ads: Ad[] }) {
  if (ads.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          कोणत्याही जाहिराती आढळल्या नाहीत.
        </p>
        <p className="text-sm text-muted-foreground">
          पहिली जाहिरात टाकणारे तुम्ही व्हा!
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
  const { user, userProfile, loading, handleLogout } = useAuth();
  const router = useRouter();

  const approvedAds = mockAds.filter((ad) => ad.status === 'approved');
  const livestockAds = approvedAds.filter((ad) => ad.category === 'पशुधन');
  const produceAds = approvedAds.filter((ad) => ad.category === 'शेती उत्पादन');
  const equipmentAds = approvedAds.filter((ad) => ad.category === 'उपकरणे');

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

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
                {loading ? null : user ? (
                    <div className="flex items-center gap-2">
                        <Link href="/more">
                            <Avatar className="h-8 w-8 cursor-pointer">
                                <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100`} />
                                <AvatarFallback>{userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={onLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                ) : (
                    <Button asChild variant="outline">
                        <Link href="/login">लॉगिन करा</Link>
                    </Button>
                )}
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
            <AdList ads={approvedAds} />
          </TabsContent>
          <TabsContent value="पशुधन" className="mt-4">
            <AdList ads={livestockAds} />
          </TabsContent>
          <TabsContent value="शेती उत्पादन" className="mt-4">
            <AdList ads={produceAds} />
          </TabsContent>
          <TabsContent value="उपकरणे" className="mt-4">
            <AdList ads={equipmentAds} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
