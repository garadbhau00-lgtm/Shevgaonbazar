
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
import { useLanguage } from '@/contexts/language-context';

export default function EditAdPage() {
    const { adId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const { dictionary } = useLanguage();
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            toast({ variant: 'destructive', title: dictionary.editAd.unauthorizedTitle, description: dictionary.editAd.unauthorizedDescription });
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
                        toast({ variant: 'destructive', title: dictionary.editAd.forbiddenTitle, description: dictionary.editAd.forbiddenDescription });
                        router.push('/my-ads');
                    } else {
                        setAd(adData);
                    }
                } else {
                    toast({ variant: 'destructive', title: dictionary.editAd.notFoundTitle, description: dictionary.editAd.notFoundDescription });
                    router.push('/my-ads');
                }
            } catch (error) {
                console.error("Error fetching ad:", error);
                toast({ variant: 'destructive', title: dictionary.editAd.errorTitle, description: dictionary.editAd.errorDescription });
            } finally {
                setLoading(false);
            }
        };

        if (adId) {
            fetchAd();
        }
    }, [adId, user, authLoading, router, toast, dictionary]);

    if (loading || authLoading) {
        return (
            <>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <main className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">{dictionary.editAd.title}</h1>
                    <p className="text-muted-foreground">{dictionary.editAd.description}</p>
                </div>
                {ad ? <AdForm existingAd={ad} /> : <p>{dictionary.editAd.loadingAd}</p>}
            </main>
        </>
    );
}
    