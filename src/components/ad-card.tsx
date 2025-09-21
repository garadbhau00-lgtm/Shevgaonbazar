
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AdCard({ ad }: AdCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const adPhotoUrl = ad.photos?.[0];

  const imageHint = adPhotoUrl?.startsWith('data:image') 
    ? 'uploaded image' 
    : (PlaceHolderImages.find((p) => p.imageUrl === adPhotoUrl)?.imageHint || 'agriculture');


  return (
    <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-secondary">
        {mounted && adPhotoUrl ? (
            <Image
              src={adPhotoUrl}
              alt={ad.title}
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
        <Button className="w-full" size="sm">
          तपशील पहा
        </Button>
      </CardFooter>
    </Card>
  );
}

type AdCardProps = {
  ad: Ad;
};
