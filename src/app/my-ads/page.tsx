
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Ad } from '@/lib/types';
import { Edit, Loader2, Trash2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

export default function MyAdsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [myAds, setMyAds] = useState<Ad[]>([]);
    const [adsLoading, setAdsLoading] = useState(true);
    const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const adsData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
                .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setMyAds(adsData);
            setAdsLoading(false);
        }, (error) => {
            console.error("Error fetching user ads: ", error);
            if (error.message.includes("requires an index")) {
                 toast({ variant: 'destructive', title: 'त्रुटी', description: 'तुमच्या जाहिराती आणण्यात अयशस्वी. कृपया फायरस्टोअर इंडेक्स तपासा.' });
            } else {
                toast({ variant: 'destructive', title: 'त्रुटी', description: 'तुमच्या जाहिराती आणण्यात अयशस्वी.' });
            }
            setAdsLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast]);

    const handleConfirmDelete = async () => {
        if (!adToDelete) return;

        setIsDeleting(true);
        try {
            const adDocRef = doc(db, 'ads', adToDelete.id);
            await deleteDoc(adDocRef);
            toast({
                title: 'यशस्वी!',
                description: 'तुमची जाहिरात यशस्वीरित्या हटवली आहे.',
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
            <div>
                <AppHeader />
                <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div>
             <div className="relative h-28 w-full">
                <AppHeader />
                <Image
                    src="https://picsum.photos/seed/my-ads/1200/400"
                    alt="My ads background"
                    fill
                    className="object-cover"
                    data-ai-hint="farm tools"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">माझ्या जाहिराती</h1>
                    <p className="mt-2 text-xs max-w-xl">तुम्ही पोस्ट केलेल्या सर्व जाहिराती येथे पहा.</p>
                </div>
            </div>
            <main className="p-4 pb-20">
                {myAds.length > 0 ? (
                    <div className="space-y-4">
                        {myAds.map(ad => (
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

                                        <Badge variant={getStatusVariant(ad.status)} className="mt-1">
                                            {statusTranslations[ad.status]}
                                        </Badge>
                                    </CardContent>
                                    <CardFooter className="p-3 space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => router.push(`/edit-ad/${ad.id}`)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setAdToDelete(ad)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </div>
                                {ad.status === 'rejected' && ad.rejectionReason && (
                                    <Alert variant="destructive" className="m-4 mt-0">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>नाकारण्याचे कारण</AlertTitle>
                                        <AlertDescription>
                                            {ad.rejectionReason}
                                        </AlertDescription>
                                    </Alert>
                                )}
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

                <AlertDialog open={!!adToDelete} onOpenChange={(open) => !open && setAdToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>तुम्ही जाहिरात हटवण्याची खात्री आहे का?</AlertDialogTitle>
                            <AlertDialogDescription>
                                ही क्रिया पूर्ववत केली जाऊ शकत नाही. यामुळे तुमची जाहिरात आमच्या सर्व्हरवरून कायमची हटवली जाईल.
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
        </div>
    );
}
