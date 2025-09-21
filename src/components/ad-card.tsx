
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Ad } from '@/lib/types';

export default function AdCard({ ad }: AdCardProps) {
  const adPhotoUrl = ad.photos?.[0];

  return (
    <Link href={`/ad/${ad.id}`} passHref>
        <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg h-full">
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
                फोटो नाही
            </div>
            )}
        </div>
        <CardContent className="p-1.5 flex-grow flex flex-col">
          <div className="flex justify-between items-start flex-grow">
            <div className="flex-grow overflow-hidden mr-2">
              <h3 className="font-medium text-[11px] text-muted-foreground truncate">{ad.category}</h3>
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
  );
}

type AdCardProps = {
  ad: Ad;
};
