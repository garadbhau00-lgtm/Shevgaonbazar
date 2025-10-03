
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import type { Ad, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BadgeIndianRupee, MapPin, Phone, User, CalendarDays, MessageSquare } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { Separator } from '@/components/ui/separator';


export default function AdDetailPage() {
    const { adId } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, userProfile, loading: authLoading } = useAuth();
    const { dictionary } = useLanguage();
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({ variant: 'destructive', title: dictionary.adDetail.loginRequiredTitle, description: dictionary.adDetail.loginRequiredDescription });
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
                        toast({ variant: 'destructive', title: dictionary.adDetail.adNotAvailableTitle, description: dictionary.adDetail.adNotAvailableDescription });
                        router.push('/');
                    } else {
                        setAd(adData);
                    }
                } else {
                    toast({ variant: 'destructive', title: dictionary.adDetail.notFoundTitle, description: dictionary.adDetail.notFoundDescription });
                    router.push('/');
                }
            } catch (error) {
                console.error("Error fetching ad:", error);
                toast({ variant: 'destructive', title: dictionary.adDetail.errorTitle, description: dictionary.adDetail.errorDescription });
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [adId, router, toast, user, authLoading, dictionary]);
    
    const handleStartChat = async () => {
        if (!user || !userProfile || !ad) return;

        if (user.uid === ad.userId) {
            toast({
                description: "You cannot start a chat about your own ad.",
            });
            return;
        }

        setIsCreatingChat(true);
        try {
            // Check if a conversation already exists
            const q = query(
                collection(db, 'conversations'),
                where('adId', '==', ad.id),
                where('participants', 'array-contains', user.uid)
            );
            
            const querySnapshot = await getDocs(q);
            const existingConvo = querySnapshot.docs.find(doc => doc.data().participants.includes(ad.userId));

            if (existingConvo) {
                router.push(`/inbox/${existingConvo.id}`);
            } else {
                // Fetch ad owner's profile
                const ownerProfileSnap = await getDoc(doc(db, 'users', ad.userId));
                if (!ownerProfileSnap.exists()) {
                    throw new Error("Ad owner profile not found.");
                }
                const ownerProfile = ownerProfileSnap.data() as UserProfile;

                // Create a new conversation
                const newConversationRef = await addDoc(collection(db, 'conversations'), {
                    adId: ad.id,
                    adPhoto: ad.photos[0] || '',
                    adTitle: dictionary.categories[ad.category] || ad.category,
                    participants: [user.uid, ad.userId],
                    participantProfiles: {
                        [user.uid]: {
                            name: userProfile.name || user.email,
                            photoURL: userProfile.photoURL || '',
                        },
                        [ownerProfile.uid]: {
                            name: ownerProfile.name || ownerProfile.email,
                            photoURL: ownerProfile.photoURL || '',
                        }
                    },
                    lastMessageTimestamp: serverTimestamp(),
                    unreadBy: {
                        [user.uid]: false,
                        [ad.userId]: true,
                    },
                    lastMessage: `${userProfile.name} started a conversation.`,
                    lastMessageSenderId: user.uid,
                });
                router.push(`/inbox/${newConversationRef.id}`);
            }

        } catch (error) {
            console.error("Error starting chat:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to start chat." });
        } finally {
            setIsCreatingChat(false);
        }
    };


    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!ad) {
        return null;
    }
    
    const formattedDate = ad.createdAt?.toDate ? format(ad.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A';

    return (
        <main className="pb-24">
            <div className="p-4 bg-card">
               <Carousel className="w-full">
                    <CarouselContent>
                        {ad.photos && ad.photos.length > 0 ? ad.photos.map((photo, index) => (
                            <CarouselItem key={index}>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                                    <Image src={photo} alt={`${ad.category} - photo ${index+1}`} fill className="object-cover" />
                                </div>
                            </CarouselItem>
                        )) : (
                             <CarouselItem>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                                   <p className="text-muted-foreground">{dictionary.adDetail.noPhoto}</p>
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
                 <h1 className="text-2xl font-bold">{dictionary.categories[ad.category] || ad.category}</h1>
                 {ad.subcategory && <p className="text-lg text-muted-foreground -mt-3">{ad.subcategory}</p>}

                {ad.price && (
                    <div className="flex items-center text-2xl font-bold text-primary">
                        <BadgeIndianRupee className="h-6 w-6 mr-2" />
                        <span>{ad.price.toLocaleString('en-IN')}</span>
                    </div>
                )}
                
                 {ad.description && (
                    <>
                        <Separator />
                        <div>
                            <h2 className="text-lg font-semibold mb-2">{dictionary.adForm.description.label}</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">{ad.description}</p>
                        </div>
                        <Separator />
                    </>
                )}

                 <div className="flex items-center text-lg font-semibold">
                    <User className="h-5 w-5 mr-2" />
                    <span>{ad.userName}</span>
                </div>

                <div className="flex items-center text-lg font-semibold text-green-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{ad.location}, {ad.taluka}</span>
                </div>
                 
                 <Link href={`tel:${ad.mobileNumber}`} className="flex items-center text-lg font-semibold text-green-600">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>{ad.mobileNumber}</span>
                </Link>
                
                 <div className="flex items-center text-muted-foreground">
                    <CalendarDays className="h-5 w-5 mr-2" />
                    <span>{dictionary.adDetail.postedOn}: {formattedDate}</span>
                </div>
            </div>

            {user?.uid !== ad.userId && (
                <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-2 bg-background border-t">
                   <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            size="lg"
                            onClick={handleStartChat}
                            disabled={isCreatingChat}
                        >
                             {isCreatingChat ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                             ) : (
                                <MessageSquare className="mr-2 h-5 w-5" />
                             )}
                            चॅट करा
                        </Button>
                        <Link href={`tel:${ad.mobileNumber}`} className="w-full">
                            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                                <Phone className="mr-2 h-5 w-5" />
                                {dictionary.adDetail.callButton}
                            </Button>
                        </Link>
                   </div>
                </div>
            )}
        </main>
    );
}
