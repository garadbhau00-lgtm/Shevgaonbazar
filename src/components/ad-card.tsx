
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
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
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

export default function AdCard({ ad }: AdCardProps) {
  const adPhotoUrl = ad.photos?.[0];
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const { dictionary } = useLanguage();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'ads', ad.id));
      toast({
        title: 'यशस्वी!',
        description: 'जाहिरात यशस्वीरित्या हटवली आहे.',
      });
      setIsDeleteDialogOpen(false);
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

  return (
    <>
      <Link href={`/ad/${ad.id}`} passHref>
        <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg h-full relative">
          {userProfile?.role === 'Admin' && (
             <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 z-10"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
          )}
          <div className="relative aspect-square bg-secondary">
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
                {dictionary.home.adCard.noPhoto}
              </div>
            )}
          </div>
          <CardContent className="p-1.5 flex-grow flex flex-col">
            <div className="flex justify-between items-start flex-grow">
              <div className="flex-grow overflow-hidden mr-2">
                <h3 className="font-medium text-[11px] text-muted-foreground truncate">{dictionary.categories[ad.category] || ad.category}</h3>
                {ad.subcategory && <p className="font-semibold text-xs truncate">{ad.subcategory}</p>}
                <p className="text-[10px] text-muted-foreground truncate">{ad.location}</p>
              </div>
              <div className="flex-shrink-0">
                <p className="text-sm font-bold text-primary text-right">
                  ₹{ad.price.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                  <AlertDialogTitle>तुम्ही जाहिरात हटवण्याची खात्री आहे का?</AlertDialogTitle>
                  <AlertDialogDescription>
                      ही क्रिया पूर्ववत केली जाऊ शकत नाही. यामुळे ही जाहिरात कायमची हटवली जाईल.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(false); }} disabled={isDeleting}>रद्द करा</AlertDialogCancel>
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
    </>
  );
}

type AdCardProps = {
  ad: Ad;
};
