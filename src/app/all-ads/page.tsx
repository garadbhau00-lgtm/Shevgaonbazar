
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Ad, UserProfile } from '@/lib/types';
import { Edit, Loader2, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppHeader from '@/components/layout/app-header';


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

type AdWithUser = Ad & { userEmail?: string };

export default function AllAdsPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allAds, setAllAds] = useState<AdWithUser[]>([]);
    const [adsLoading, setAdsLoading] = useState(true);
    const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!userProfile || userProfile.role !== 'Admin') {
            toast({
                variant: 'destructive',
                title: 'प्रवेश प्रतिबंधित',
                description: 'तुम्ही ही संसाधने पाहण्यासाठी अधिकृत नाही.',
            });
            router.push('/more');
            return;
        }

        const q = query(
            collection(db, 'ads')
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const adsData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
                .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            
            // Fetch user emails
            const userIds = [...new Set(adsData.map(ad => ad.userId))];
            const userProfiles: Record<string, UserProfile> = {};
            
            for (const userId of userIds) {
                const userDocRef = doc(db, 'users', userId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    userProfiles[userId] = userDocSnap.data() as UserProfile;
                }
            }
            
            const adsWithUsers = adsData.map(ad => ({
                ...ad,
                userEmail: userProfiles[ad.userId]?.email || 'Unknown User'
            }));

            setAllAds(adsWithUsers);
            setAdsLoading(false);
        }, (error) => {
            console.error("Error fetching all ads: ", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'सर्व जाहिराती आणण्यात अयशस्वी.' });
            setAdsLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile, authLoading, router, toast]);

    const handleConfirmDelete = async () => {
        if (!adToDelete) return;

        setIsDeleting(true);
        try {
            const adDocRef = doc(db, 'ads', adToDelete.id);
            await deleteDoc(adDocRef);
            toast({
                title: 'यशस्वी!',
                description: 'जाहिरात यशस्वीरित्या हटवली आहे.',
            });
            setAdToDelete(null);
        } catch (error) {
            console.error("Error deleting ad: ", error);
            toast({
                variant: 'destructive',
                title: 'त्रुटी',
                description: 'जाहिरात हटवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
            });
        } finally {
            setIsDeleting(false);
        }
    };


    if (authLoading || adsLoading) {
        return (
            <>
                <AppHeader />
                <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        )
    }

    return (
        <>
            <AppHeader />
            <main className="p-4 pb-20">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">सर्व जाहिराती</h1>
                    <p className="text-muted-foreground">सर्व वापरकर्त्यांच्या जाहिराती व्यवस्थापित करा.</p>
                </div>

                {allAds.length > 0 ? (
                    <div className="space-y-4">
                        {allAds.map(ad => (
                            <Card key={ad.id} className="flex flex-col">
                                <div className='flex items-center w-full'>
                                    <CardHeader className="flex-shrink-0 p-2">
                                        <div className="relative h-20 w-20 rounded-md overflow-hidden">
                                            {ad.photos && ad.photos.length > 0 ? (
                                                <Image
                                                    src={ad.photos[0]}
                                                    alt={ad.title || ''}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ): (
                                                <div className="h-full w-full bg-secondary flex items-center justify-center">
                                                    <p className="text-xs text-muted-foreground">फोटो नाही</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow p-3">
                                        <h3 className="font-semibold">{ad.title}</h3>
                                        <p className="text-sm font-bold text-primary">₹{ad.price.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-muted-foreground">{ad.userEmail}</p>
                                        <Badge variant={getStatusVariant(ad.status)} className="mt-1">
                                            {statusTranslations[ad.status]}
                                        </Badge>
                                    </CardContent>
                                    <CardFooter className="p-3 space-x-2">
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setAdToDelete(ad)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
                        <p className="text-lg font-semibold text-muted-foreground">
                            कोणत्याही जाहिराती आढळल्या नाहीत.
                        </p>
                    </div>
                )}

                <AlertDialog open={!!adToDelete} onOpenChange={(open) => !open && setAdToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>तुम्ही जाहिरात हटवण्याची खात्री आहे का?</AlertDialogTitle>
                            <AlertDialogDescription>
                                ही क्रिया पूर्ववत केली जाऊ शकत नाही. यामुळे वापरकर्त्याची जाहिरात सर्व्हरवरून कायमची हटवली जाईल.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>रद्द करा</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                हटवा
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </>
    );
}
