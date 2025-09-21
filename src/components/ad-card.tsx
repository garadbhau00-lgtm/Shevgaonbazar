
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';

export default function AdCard({ ad }: AdCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const adPhotoUrl = ad.photos?.[0];

  const handleChatClick = async () => {
    if (!user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'लॉगिन आवश्यक',
        description: 'विक्रेत्याशी चॅट करण्यासाठी कृपया लॉगिन करा.',
      });
      router.push('/login');
      return;
    }

    if (user.uid === ad.userId) {
        toast({
            variant: 'destructive',
            title: 'ही तुमची स्वतःची जाहिरात आहे',
            description: 'तुम्ही तुमच्या स्वतःच्या जाहिरातीवर चॅट सुरू करू शकत नाही.',
        });
        return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check if a conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('adId', '==', ad.id),
        where('participants', 'array-contains', user.uid)
      );

      const querySnapshot = await getDocs(q);
      let existingConversationId: string | null = null;
      
      querySnapshot.forEach(doc => {
          const conversation = doc.data();
          if (conversation.participants.includes(ad.userId)) {
              existingConversationId = doc.id;
          }
      });


      if (existingConversationId) {
        // 2. If it exists, navigate to it
        router.push(`/inbox/${existingConversationId}`);
      } else {
        // 3. If not, create a new one
        const sellerDocRef = doc(db, 'users', ad.userId);
        const sellerDoc = await getDoc(sellerDocRef);
        const sellerProfile = sellerDoc.data();

        if (!sellerProfile) {
          throw new Error("विक्रेता प्रोफाइल आढळले नाही.");
        }

        const newConversation = {
          adId: ad.id,
          adPhoto: ad.photos[0] || '',
          adTitle: ad.title || ad.category,
          participants: [user.uid, ad.userId],
          participantProfiles: {
            [user.uid]: {
              name: userProfile.name || user.email,
              photoURL: user.photoURL || '',
            },
            [ad.userId]: {
              name: sellerProfile.name || sellerProfile.email,
              photoURL: sellerProfile.photoURL || '',
            },
          },
          lastMessageTimestamp: serverTimestamp(),
          unreadBy: {
            [ad.userId]: true
          }
        };

        const docRef = await addDoc(conversationsRef, newConversation);
        router.push(`/inbox/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        variant: 'destructive',
        title: 'त्रुटी',
        description: 'चॅट सुरू करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-secondary">
        {adPhotoUrl ? (
          <Image
            src={adPhotoUrl}
            alt={ad.title || ad.category}
            fill
            className="object-cover"
            data-ai-hint={'agriculture item'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
            फोटो नाही
          </div>
        )}
      </div>
      <CardContent className="flex-grow p-3">
        <h3 className="font-semibold truncate">{ad.category}</h3>
        {ad.subcategory && (
          <p className="text-sm text-muted-foreground truncate">
            {ad.subcategory}
          </p>
        )}
        <p className="text-lg font-bold text-primary mt-1">
          ₹{ad.price.toLocaleString('en-IN')}
        </p>
        <p className="text-sm text-muted-foreground truncate">{ad.location}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button
          className="w-full"
          size="sm"
          onClick={handleChatClick}
          disabled={authLoading || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 h-4 w-4" />
          )}
          चॅट करा
        </Button>
      </CardFooter>
    </Card>
  );
}

type AdCardProps = {
  ad: Ad;
};
