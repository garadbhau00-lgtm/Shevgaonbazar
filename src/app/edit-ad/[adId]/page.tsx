
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ad } from '@/lib/types';
import AdForm from '@/app/post-ad/_components/ad-form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function EditAdPage() {
    const { adId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            toast({ variant: 'destructive', title: 'Unauthorized', description: 'Please log in to edit an ad.' });
            router.push('/login');
            return;
        }

        const fetchAd = async () => {
            try {
                const docRef = doc(db, 'ads', adId as string);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const adData = { id: docSnap.id, ...docSnap.data() } as Ad;
                    if (adData.userId !== user.uid) {
                        toast({ variant: 'destructive', title: 'Forbidden', description: 'You do not have permission to edit this ad.' });
                        router.push('/my-ads');
                    } else {
                        setAd(adData);
                    }
                } else {
                    toast({ variant: 'destructive', title: 'Not Found', description: 'Ad not found.' });
                    router.push('/my-ads');
                }
            } catch (error) {
                console.error("Error fetching ad:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch ad details.' });
            } finally {
                setLoading(false);
            }
        };

        if (adId) {
            fetchAd();
        }
    }, [adId, user, authLoading, router, toast]);

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <main className="p-4">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">जाहिरात संपादित करा</h1>
                <p className="text-muted-foreground">तुमच्या जाहिरातीमधील तपशील बदला.</p>
            </div>
            {ad ? <AdForm existingAd={ad} /> : <p>जाहिरात लोड होत आहे...</p>}
        </main>
    );
}
