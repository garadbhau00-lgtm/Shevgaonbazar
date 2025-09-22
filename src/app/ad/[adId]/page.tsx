
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import type { Ad } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BadgeIndianRupee, MapPin, Phone } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/layout/app-header';
import { useAuth } from '@/hooks/use-auth';

export default function AdDetailPage() {
    const { adId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({ variant: 'destructive', title: 'लॉगिन आवश्यक', description: 'जाहिरातीचे तपशील पाहण्यासाठी कृपया लॉगिन करा.' });
            router.push('/login');
            return;
        }
        
        const fetchAd = async () => {
            if (!adId) return;
            try {
                const docRef = doc(db, 'ads', adId as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const adData = { id: docSnap.id, ...docSnap.data() } as Ad;
                     if (adData.status !== 'approved' && adData.userId !== user.uid) {
                        toast({ variant: 'destructive', title: 'Ad Not Available', description: 'This ad is not currently available for viewing.' });
                        router.push('/');
                    } else {
                        setAd(adData);
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Not Found', description: 'Ad not found.' });
                    router.push('/');
                }
            } catch (error) {
                console.error("Error fetching ad:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch ad details.' });
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [adId, router, toast, user, authLoading]);

    if (loading || authLoading) {
        return (
            <>
                <AppHeader />
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }
    
    if (!ad) {
        // This will be shown briefly during redirect or if the ad is not found
        return null;
    }

    return (
        <main className="pb-24">
            <AppHeader />
            <div className="p-4 bg-card">
               <Carousel className="w-full">
                    <CarouselContent>
                        {ad.photos && ad.photos.length > 0 ? ad.photos.map((photo, index) => (
                            <CarouselItem key={index}>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                                    <Image src={photo} alt={`${ad.title} - photo ${index+1}`} fill className="object-cover" />
                                </div>
                            </CarouselItem>
                        )) : (
                             <CarouselItem>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                                   <p className="text-muted-foreground">फोटो नाही</p>
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                    {ad.photos && ad.photos.length > 1 && (
                        <>
                            <CarouselPrevious className="absolute left-2" />
                            <CarouselNext className="absolute right-2" />
                        </>
                    )}
                </Carousel>
            </div>
            
            <div className="p-4 space-y-4">
                 <h1 className="text-2xl font-bold">{ad.title || ad.category}</h1>
                 {ad.subcategory && <p className="text-lg text-muted-foreground -mt-3">{ad.subcategory}</p>}

                <div className="flex items-center text-2xl font-bold text-primary">
                    <BadgeIndianRupee className="h-6 w-6 mr-2" />
                    <span>{ad.price.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{ad.location}</span>
                </div>
                 
                 <Link href={`tel:${ad.mobileNumber}`} className="flex items-center text-muted-foreground">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>{ad.mobileNumber}</span>
                </Link>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-background border-t">
                <Link href={`tel:${ad.mobileNumber}`} className="w-full">
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                        <Phone className="mr-2 h-5 w-5" />
                        कॉल करा
                    </Button>
                </Link>
            </div>
        </main>
    );
}
