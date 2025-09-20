
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/app-header';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, BadgeIndianRupee } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
};

export default function AdManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [ads, setAds] = useState<Ad[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const checkAdminAndFetchAds = () => {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'तुमच्याकडे ही संसाधने पाहण्याची परवानगी नाही.' });
                router.push('/more');
                return;
            }

            const q = query(collection(db, "ads"), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const adsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
                setAds(adsList);
                setPageLoading(false);
            }, (error) => {
                console.error("Error fetching ads:", error);
                toast({ variant: 'destructive', title: 'त्रुटी', description: 'जाहिराती आणण्यात अयशस्वी.' });
                setPageLoading(false);
            });

            return unsubscribe;
        };

        if (!authLoading) {
            const unsubscribe = checkAdminAndFetchAds();
            return () => unsubscribe && unsubscribe();
        }
    }, [authLoading, userProfile, router, toast]);

    const handleUpdateStatus = async (id: string, status: Ad['status']) => {
        try {
            const adDoc = doc(db, 'ads', id);
            await updateDoc(adDoc, { status });
            toast({ title: 'यशस्वी', description: `जाहिरात यशस्वीरित्या ${status === 'approved' ? 'स्वीकृत' : 'नाकारली'} झाली आहे.` });
        } catch (error) {
            console.error("Error updating ad status:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'जाहिरातीची स्थिती अद्यतनित करण्यात अयशस्वी.' });
        }
    };

    if (authLoading || pageLoading) {
        return (
            <div>
                <AppHeader showUserOptions={false} />
                <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">जाहिरात व्यवस्थापन</h1>
                    <p className="text-muted-foreground">प्रलंबित जाहिरातींचे पुनरावलोकन करा, स्वीकृत करा किंवा नाकारा.</p>
                </div>
                <div className="space-y-4">
                    {ads.length > 0 ? ads.map((ad) => (
                        <Card key={ad.id} className="overflow-hidden">
                            <div className="relative h-40 w-full">
                                <Image src={ad.photos[0]} alt={ad.title} fill className="object-cover" />
                                <Badge variant={getStatusVariant(ad.status)} className="absolute top-2 right-2">
                                    {statusTranslations[ad.status]}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle>{ad.title}</CardTitle>
                                <CardDescription>{ad.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{ad.description}</p>
                                <div className="mt-2 flex items-center font-semibold text-primary">
                                    <BadgeIndianRupee className="h-5 w-5 mr-1" />
                                    <span>{ad.price.toLocaleString('en-IN')}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-secondary/50 p-3">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                                    disabled={ad.status === 'rejected'}
                                >
                                    <X className="mr-1 h-4 w-4" /> नाकारा
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(ad.id, 'approved')}
                                    disabled={ad.status === 'approved'}
                                >
                                    <Check className="mr-1 h-4 w-4" /> स्वीकृत करा
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="text-center text-muted-foreground mt-8 rounded-lg border-2 border-dashed py-12">
                            <p className="text-lg font-semibold">कोणत्याही जाहिराती आढळल्या नाहीत.</p>
                            <p className="text-sm">जेव्हा वापरकर्ते जाहिराती सबमिट करतील, तेव्हा त्या येथे दिसतील.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
