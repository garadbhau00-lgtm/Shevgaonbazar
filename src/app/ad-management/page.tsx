
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, BadgeIndianRupee, Phone } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';

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

export default function AdManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();

    const statusTranslations = dictionary.adManagement.status;

    const [ads, setAds] = useState<Ad[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [adToReject, setAdToReject] = useState<Ad | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkAdminAndFetchAds = () => {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: dictionary.adManagement.accessDeniedTitle, description: dictionary.adManagement.accessDeniedDescription });
                router.push('/more');
                return;
            }

            const q = query(
                collection(db, "ads"), 
                where('status', '==', 'pending')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const adsList = querySnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() } as Ad))
                  .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
                setAds(adsList);
                setPageLoading(false);
            }, (error) => {
                console.error("Error fetching ads:", error);
                toast({ variant: 'destructive', title: dictionary.adManagement.errorTitle, description: dictionary.adManagement.errorFetch });
                setPageLoading(false);
            });

            return unsubscribe;
        };

        if (!authLoading) {
            const unsubscribe = checkAdminAndFetchAds();
            return () => unsubscribe && unsubscribe();
        }
    }, [authLoading, userProfile, router, toast, dictionary]);
    
    const handleUpdateStatus = async (ad: Ad, status: 'approved') => {
        try {
            const adDoc = doc(db, 'ads', ad.id);
            await updateDoc(adDoc, { status });
            
            const adTitle = dictionary.categories[ad.category] || ad.category;
            await addDoc(collection(db, 'notifications'), {
                userId: ad.userId,
                title: 'तुमची जाहिरात मंजूर झाली आहे',
                message: `तुमची जाहिरात "${adTitle}" आता अॅपवर थेट आहे.`,
                link: `/ad/${ad.id}`,
                isRead: false,
                createdAt: serverTimestamp(),
                type: 'ad_status',
            });

            toast({ title: dictionary.adManagement.successTitle, description: dictionary.adManagement.successApprove });
        } catch (error) {
            console.error("Error updating ad status:", error);
            toast({ variant: 'destructive', title: dictionary.adManagement.errorTitle, description: dictionary.adManagement.errorUpdate });
        }
    };

    const handleOpenRejectDialog = (ad: Ad) => {
        setAdToReject(ad);
    }
    
    const handleCloseRejectDialog = () => {
        setAdToReject(null);
        setRejectionReason('');
    }

    const handleRejectSubmit = async () => {
        if (!adToReject || !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: dictionary.adManagement.errorTitle, description: dictionary.adManagement.reasonRequired });
            return;
        }

        setIsSubmitting(true);
        try {
            const adDoc = doc(db, 'ads', adToReject.id);
            const reason = rejectionReason.trim();
            await updateDoc(adDoc, { status: 'rejected', rejectionReason: reason });

            const adTitle = dictionary.categories[adToReject.category] || adToReject.category;
            await addDoc(collection(db, 'notifications'), {
                userId: adToReject.userId,
                title: 'तुमची जाहिरात नाकारली आहे',
                message: `तुमची जाहिरात "${adTitle}" नाकारण्यात आली आहे. कारण: ${reason}`,
                link: `/ad/${adToReject.id}`,
                isRead: false,
                createdAt: serverTimestamp(),
                type: 'ad_status',
            });
            
            toast({ title: dictionary.adManagement.successTitle, description: dictionary.adManagement.successReject });
            handleCloseRejectDialog();
        } catch (error) {
            console.error("Error rejecting ad:", error);
            toast({ variant: 'destructive', title: dictionary.adManagement.errorTitle, description: dictionary.adManagement.errorReject });
        } finally {
            setIsSubmitting(false);
        }
    }


    if (authLoading || pageLoading) {
        return (
            <>
                <div className="relative h-28 w-full">
                </div>
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative h-28 w-full">
                <Image
                  src="https://picsum.photos/seed/ad-management/1200/400"
                  alt="Ad Management background"
                  fill
                  className="object-cover"
                  data-ai-hint="farm checklist"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{dictionary.adManagement.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{dictionary.adManagement.description}</p>
                </div>
            </div>
            <main className="p-4">
                <div className="space-y-4">
                    {ads.length > 0 ? ads.map((ad) => (
                        <Card key={ad.id} className="overflow-hidden">
                            <div className="relative h-40 w-full">
                                {ad.photos && ad.photos.length > 0 && (
                                    <Image src={ad.photos[0]} alt={ad.category || ''} fill className="object-cover" />
                                )}
                                <Badge variant={getStatusVariant(ad.status)} className="absolute top-2 right-2">
                                    {statusTranslations[ad.status]}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle>{dictionary.categories[ad.category] || ad.category}</CardTitle>
                                <CardDescription>{ad.location}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 flex items-center font-semibold text-primary">
                                    <BadgeIndianRupee className="h-5 w-5 mr-1" />
                                    <span>{ad.price.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="mt-2 flex items-center text-sm font-semibold text-muted-foreground">
                                    <Phone className="h-4 w-4 mr-2" />
                                    <span>{ad.mobileNumber}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-secondary/50 p-3">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleOpenRejectDialog(ad)}
                                >
                                    <X className="mr-1 h-4 w-4" /> {dictionary.adManagement.rejectButton}
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(ad, 'approved')}
                                >
                                    <Check className="mr-1 h-4 w-4" /> {dictionary.adManagement.approveButton}
                                </Button>
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="text-center text-muted-foreground mt-8 rounded-lg border-2 border-dashed py-12">
                            <p className="text-lg font-semibold">{dictionary.adManagement.noPendingAdsTitle}</p>
                            <p className="text-sm">{dictionary.adManagement.noPendingAdsDescription}</p>
                        </div>
                    )}
                </div>
                <AlertDialog open={!!adToReject} onOpenChange={(open) => !open && handleCloseRejectDialog()}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{dictionary.adManagement.rejectDialogTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {dictionary.adManagement.rejectDialogDescription}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid w-full gap-1.5">
                            <Label htmlFor="rejection-reason">{dictionary.adManagement.rejectionReasonLabel}</Label>
                            <Textarea 
                                id="rejection-reason"
                                placeholder={dictionary.adManagement.rejectionReasonPlaceholder}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCloseRejectDialog} disabled={isSubmitting}>{dictionary.adManagement.cancelButton}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRejectSubmit} disabled={isSubmitting || !rejectionReason.trim()}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {dictionary.adManagement.confirmRejectButton}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </>
    );
}
