
'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Ad } from '@/lib/types';
import { Edit, Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const getStatusVariant = (status: Ad['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
  }
};

const statusTranslations: Record<Ad['status'], string> = {
    approved: 'स्वीकृत',
    pending: 'प्रलंबित',
    rejected: 'नाकारले'
}

export default function MyAdsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [myAds, setMyAds] = useState<Ad[]>([]);
    const [adsLoading, setAdsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'प्रवेश प्रतिबंधित',
                description: 'तुमच्या जाहिराती पाहण्यासाठी कृपया लॉगिन करा.',
            });
            router.push('/login');
            return;
        }

        const q = query(
            collection(db, 'ads'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
            setMyAds(adsData);
            setAdsLoading(false);
        }, (error) => {
            console.error("Error fetching user ads: ", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'तुमच्या जाहिराती आणण्यात अयशस्वी.' });
            setAdsLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast]);

    if (authLoading || adsLoading) {
        return (
            <div>
                <AppHeader showUserOptions={false} />
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <AppHeader showUserOptions={false}/>
            <main className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">माझ्या जाहिराती</h1>
                    <p className="text-muted-foreground">तुम्ही पोस्ट केलेल्या सर्व जाहिराती येथे पहा.</p>
                </div>

                {myAds.length > 0 ? (
                    <div className="space-y-4">
                        {myAds.map(ad => (
                            <Card key={ad.id} className="flex items-center">
                                <CardHeader className="flex-shrink-0 p-2">
                                    <div className="relative h-20 w-20">
                                        <Image
                                            src={ad.photos[0]}
                                            alt={ad.title}
                                            fill
                                            className="rounded-md object-cover"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow p-3">
                                    <h3 className="font-semibold">{ad.title}</h3>
                                    <p className="text-sm font-bold text-primary">₹{ad.price.toLocaleString('en-IN')}</p>
                                    <Badge variant={getStatusVariant(ad.status)} className="mt-1">
                                        {statusTranslations[ad.status]}
                                    </Badge>
                                </CardContent>
                                <CardFooter className="p-3 space-x-2">
                                    <Button variant="ghost" size="icon" disabled={ad.status === 'rejected'}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
                        <p className="text-lg font-semibold text-muted-foreground">
                            तुम्ही अद्याप एकही जाहिरात पोस्ट केलेली नाही.
                        </p>
                        <Button className="mt-4" onClick={() => router.push('/post-ad')}>
                            पहिली जाहिरात पोस्ट करा
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
