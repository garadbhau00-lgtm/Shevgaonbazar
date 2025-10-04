
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ad, Conversation } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import Image from 'next/image';
import {
  Loader2,
  ArrowLeft,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  BadgeIndianRupee,
  MapPin,
  Tag,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import Link from 'next/link';


export default function AdDetailPage() {
  const { adId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        if (!adId) {
          router.push('/');
          return;
        }

        const docRef = doc(db, 'ads', adId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const adData = { id: docSnap.id, ...docSnap.data() } as Ad;
          
          if (adData.status !== 'approved' && adData.userId !== user?.uid) {
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

    if (!authLoading) {
      fetchAd();
    }
  }, [adId, authLoading, user, router, toast, dictionary]);
  
  useEffect(() => {
      if (user && ad) {
        const checkSavedStatus = async () => {
            const savedAdRef = doc(db, 'users', user.uid, 'savedAds', ad.id);
            const docSnap = await getDoc(savedAdRef);
            setIsSaved(docSnap.exists());
        };
        checkSavedStatus();
      }
  }, [user, ad]);

  const handleStartChat = async () => {
    if (!user || !ad || user.uid === ad.userId) return;
    setIsProcessingChat(true);

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('adId', '==', ad.id),
      where('participants', 'array-contains', user.uid)
    );

    try {
        const querySnapshot = await getDocs(q);
        let existingConvo: Conversation | null = null;
        querySnapshot.forEach(doc => {
            const convo = doc.data() as Conversation;
            if(convo.participants.includes(ad!.userId)) {
                existingConvo = { id: doc.id, ...convo };
            }
        });

        if (existingConvo) {
            router.push(`/inbox/${existingConvo.id}`);
            return;
        }

        // Create a new conversation
        const sellerDocRef = doc(db, 'users', ad.userId);
        const buyerDocRef = doc(db, 'users', user.uid);
        
        let sellerProfile, buyerProfile;

        try {
            const sellerDoc = await getDoc(sellerDocRef);
            if (!sellerDoc.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find seller profile.' });
                return;
            }
            sellerProfile = sellerDoc.data();
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: sellerDocRef.path, operation: 'get' }));
            setIsProcessingChat(false);
            return;
        }
        
        try {
            const buyerDoc = await getDoc(buyerDocRef);
            if (!buyerDoc.exists()) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find your user profile.' });
                return;
            }
            buyerProfile = buyerDoc.data();
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: buyerDocRef.path, operation: 'get' }));
            setIsProcessingChat(false);
            return;
        }

        const newConversationData = {
            adId: ad.id,
            adTitle: dictionary.categories[ad.category] || ad.category,
            adPhoto: ad.photos?.[0] || '',
            participants: [user.uid, ad.userId],
            participantProfiles: {
                [user.uid]: { name: buyerProfile.name, photoURL: buyerProfile.photoURL || '' },
                [ad.userId]: { name: sellerProfile.name, photoURL: sellerProfile.photoURL || '' }
            },
            lastMessage: '',
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: '',
            unreadBy: { [user.uid]: false, [ad.userId]: true }
        };

       try {
            const newConversationRef = await addDoc(conversationsRef, newConversationData);
            router.push(`/inbox/${newConversationRef.id}`);
       } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: conversationsRef.path,
                operation: 'create',
                requestResourceData: newConversationData
            }));
       }

    } catch (error: any) {
        if(error.name === 'FirestorePermissionError') {
             errorEmitter.emit('permission-error', error);
        } else {
             console.error("Error starting chat:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not start chat.' });
        }
    } finally {
        setIsProcessingChat(false);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share && ad) {
        try {
            await navigator.share({
                title: `${dictionary.categories[ad.category]} in ${ad.location}`,
                text: `Check out this ad on Shevgaon Bazar: ${ad.price ? `₹${ad.price.toLocaleString('en-IN')}` : ''}`,
                url: window.location.href
            });
        } catch (error: any) {
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                console.error('Error sharing:', error);
            }
        }
    } else {
        toast({ title: 'Not Supported', description: 'Share feature is not supported on your browser.' });
    }
  };

  const handleToggleSave = async () => {
    if (!user || !ad) {
        toast({ variant: 'destructive', title: 'Login Required', description: 'You must be logged in to save ads.' });
        return;
    }
    setIsSaving(true);
    const savedAdRef = doc(db, 'users', user.uid, 'savedAds', ad.id);

    try {
        if (isSaved) {
            await deleteDoc(savedAdRef);
            setIsSaved(false);
            toast({ title: 'Removed', description: 'Ad removed from your saved list.' });
        } else {
            const saveData = { savedAt: serverTimestamp() };
            await setDoc(savedAdRef, saveData);
            setIsSaved(true);
            toast({ title: 'Saved!', description: 'Ad added to your saved list.' });
        }
    } catch (serverError) {
        const operation = isSaved ? 'delete' : 'create';
        const error = new FirestorePermissionError({
            path: savedAdRef.path,
            operation: operation,
            requestResourceData: operation === 'create' ? { savedAt: 'serverTimestamp' } : undefined,
        });
        errorEmitter.emit('permission-error', error);
    } finally {
        setIsSaving(false);
    }
  };


  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ad) {
    return null; // Or a proper "not found" page
  }
  
  const isOwner = user?.uid === ad.userId;

  return (
    <div className="pb-24 relative">
      <header className="relative h-60 w-full">
        <Image
          src={ad.photos?.[0] || 'https://picsum.photos/seed/ad-placeholder/1200/800'}
          alt={ad.category}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <Link href="/inbox">
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white">
                <ArrowLeft />
            </Button>
        </Link>
        <div className="absolute bottom-4 left-4 text-white">
             {ad.price && (
                <div className="flex items-center gap-2 text-2xl font-bold">
                    <BadgeIndianRupee className="h-6 w-6" />
                    <span>{ad.price.toLocaleString('en-IN')}</span>
                </div>
            )}
             <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{ad.location}</span>
            </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>{dictionary.categories[ad.category] || ad.category}</span>
                {ad.subcategory && (
                    <>
                        <span className="mx-1">/</span>
                        <List className="h-4 w-4" />
                        <span>{dictionary.subcategories[ad.subcategory.toLowerCase().replace(/ /g, '_')] || ad.subcategory}</span>
                    </>
                )}
            </div>
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{ad.description || 'No description provided.'}</p>
        </div>
        
        <div className="text-xs text-muted-foreground pt-4 border-t">
          {`Posted on ${format(ad.createdAt.toDate(), 'dd MMM yyyy', { locale: enUS })}`}
        </div>

        {!isOwner && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center gap-2">
                <Button variant="ghost" className="flex-col h-auto" onClick={handleShare}>
                  <Share2 className="h-5 w-5 mb-1 text-primary"/>
                  <span className="text-xs">Share</span>
                </Button>
                <Button variant="ghost" className="flex-col h-auto text-destructive" onClick={handleToggleSave} disabled={isSaving}>
                  <Heart className={cn("h-5 w-5 mb-1", isSaved && "fill-current")} />
                  <span className="text-xs">Save</span>
                </Button>
                <Button className="flex-1" onClick={handleStartChat} disabled={isProcessingChat}>
                    {isProcessingChat ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <MessageCircle className="h-5 w-5 mr-2" />}
                     <span>Chat</span>
                </Button>
                <a href={`tel:${ad.mobileNumber}`} className="flex-1">
                    <Button className="w-full">
                        <Phone className="h-5 w-5 mr-2" />
                        <span>Call</span>
                    </Button>
                </a>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
