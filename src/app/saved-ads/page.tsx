
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, query, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Ad } from '@/lib/types';
import { Loader2, HeartOff } from 'lucide-react';
import Image from 'next/image';
import AdCard from '@/components/ad-card';
import { Button } from '@/components/ui/button';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export default function SavedAdsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [savedAds, setSavedAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'Please log in to view your saved ads.',
            });
            router.push('/login');
            return;
        }

        const savedAdsQuery = query(collection(db, 'users', user.uid, 'savedAds'));

        const unsubscribe = onSnapshot(savedAdsQuery, async (snapshot) => {
            const adIds = snapshot.docs.map(doc => doc.id);

            if (adIds.length === 0) {
                setSavedAds([]);
                setLoading(false);
                return;
            }
            
            try {
                const adPromises = adIds.map(id => getDoc(doc(db, 'ads', id)));
                const adDocs = await Promise.all(adPromises);
                
                const adsData = adDocs
                    .filter(docSnap => docSnap.exists())
                    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Ad));
                
                setSavedAds(adsData);
            } catch (serverError: any) {
                 // Check if it's a permission error and create a contextual error
                if (serverError.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: 'ads/{adId}', // Generic path as we don't know which one failed
                        operation: 'get',
                    });
                    errorEmitter.emit('permission-error', permissionError);
                } else {
                    console.error("Error fetching ad details:", serverError);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch details for saved ads.' });
                }
            } finally {
                setLoading(false);
            }

        }, (serverError) => {
            console.error("Error fetching saved ad IDs:", serverError);
            const permissionError = new FirestorePermissionError({
                path: savedAdsQuery.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast]);

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
             <header className="sticky top-0 z-10">
                <div className="relative h-28 w-full">
                    <Image
                        src="https://picsum.photos/seed/saved-ads/1200/400"
                        alt="Saved ads background"
                        fill
                        className="object-cover"
                        data-ai-hint="treasure chest"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                        <h1 className="text-lg font-bold">Saved Ads</h1>
                        <p className="mt-2 text-xs max-w-xl">Your favorite ads, all in one place.</p>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                {savedAds.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {savedAds.map((ad) => (
                            <AdCard key={ad.id} ad={ad} />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center text-center p-4">
                        <HeartOff className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-semibold text-muted-foreground">
                            You have no saved ads.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                           Tap the heart icon on an ad to save it here.
                        </p>
                        <Button className="mt-6" onClick={() => router.push('/')}>
                            Browse Ads
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
