
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Phone, User } from 'lucide-react';

export default function AdCard({ ad }: AdCardProps) {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const adPhotoUrl = ad.photos?.[0];

  const imageHint = adPhotoUrl?.startsWith('data:image') 
    ? 'uploaded image' 
    : (PlaceHolderImages.find((p) => p.imageUrl === adPhotoUrl)?.imageHint || 'agriculture');

  const handleDetailsClick = () => {
    setDialogOpen(true);
  };
  
  const handleLoginRedirect = () => {
    router.push('/login');
  }

  const renderDialogContent = () => {
    if (authLoading) {
      return null;
    }

    if (user) {
      return (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>विक्रेत्याचे तपशील</AlertDialogTitle>
            <AlertDialogDescription>
              तुम्ही विक्रेत्याशी थेट संपर्क साधू शकता.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">नाव</p>
                  <p className="font-semibold">{ad.userName || 'उपलब्ध नाही'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">मोबाईल नंबर</p>
                  <a href={`tel:${ad.mobileNumber}`} className="font-semibold text-lg hover:underline">{ad.mobileNumber}</a>
                </div>
              </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>बंद करा</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      );
    }

    return (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>लॉगिन आवश्यक</AlertDialogTitle>
            <AlertDialogDescription>
              विक्रेत्याचा मोबाईल नंबर पाहण्यासाठी कृपया लॉगिन करा.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>रद्द करा</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>लॉगिन करा</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    );
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] bg-secondary">
          {mounted && adPhotoUrl ? (
              <Image
                src={adPhotoUrl}
                alt={ad.title || ad.category}
                fill
                className="object-cover"
                data-ai-hint={imageHint}
              />
          ) : (
              <div className="h-full w-full bg-secondary"></div>
          )}
        </div>
        <CardContent className="flex-grow p-3">
          <h3 className="font-semibold truncate">{ad.category}</h3>
          {ad.subcategory && <p className="text-sm text-muted-foreground truncate">{ad.subcategory}</p>}
          <p className="text-lg font-bold text-primary mt-1">₹{ad.price.toLocaleString('en-IN')}</p>
          <p className="text-sm text-muted-foreground truncate">{ad.location}</p>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="sm" onClick={handleDetailsClick} disabled={authLoading}>
              तपशील पहा
            </Button>
          </AlertDialogTrigger>
        </CardFooter>
      </Card>
      {dialogOpen && renderDialogContent()}
    </AlertDialog>
  );
}

type AdCardProps = {
  ad: Ad;
};
