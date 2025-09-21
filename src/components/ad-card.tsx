
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Phone, User, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdCard({ ad }: AdCardProps) {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellerName, setSellerName] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const adPhotoUrl = ad.photos?.[0];

  const handleDetailsClick = async () => {
    if (!user) {
        setDialogOpen(true);
        return;
    }
    
    if (sellerName) {
        setDialogOpen(true);
        return;
    }

    setIsFetchingDetails(true);
    setDialogOpen(true);
    try {
        const userDocRef = doc(db, 'users', ad.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setSellerName(userDocSnap.data().name || 'अज्ञात विक्रेता');
        } else {
            setSellerName('अज्ञात विक्रेता');
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
        setSellerName('अज्ञात विक्रेता');
        toast({ variant: 'destructive', title: 'त्रुटी', description: 'विक्रेत्याची माहिती आणण्यात अयशस्वी.' });
    } finally {
        setIsFetchingDetails(false);
    }
  };
  
  const handleLoginRedirect = () => {
    router.push('/login');
  }
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  }

  const renderDialogContent = () => {
    if (authLoading) {
      return null;
    }

    if (!user) {
      return (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>लॉगिन आवश्यक</AlertDialogTitle>
            <AlertDialogDescription>
              विक्रेत्याचा मोबाईल नंबर पाहण्यासाठी कृपया लॉगिन करा.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>रद्द करा</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginRedirect}>लॉगिन करा</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      );
    }
    
    return (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>विक्रेत्याचे तपशील</AlertDialogTitle>
            <AlertDialogDescription>
              तुम्ही विक्रेत्याशी थेट संपर्क साधू शकता.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isFetchingDetails ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ): (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">नाव</p>
                    <p className="font-semibold">{sellerName || 'उपलब्ध नाही'}</p>
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
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDialogClose}>बंद करा</AlertDialogCancel>
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
                data-ai-hint={'agriculture item'}
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
            <Button className="w-full" size="sm" onClick={handleDetailsClick} disabled={authLoading || isFetchingDetails}>
                {isFetchingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                तपशील पहा
            </Button>
        </CardFooter>
      </Card>
      {dialogOpen && renderDialogContent()}
    </AlertDialog>
  );
}

type AdCardProps = {
  ad: Ad;
};
