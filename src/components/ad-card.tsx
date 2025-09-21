
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
        <CardContent className="flex-grow p-2 flex flex-col">
          <div className="flex-grow">
            <h3 className="font-medium text-xs truncate">{ad.category}</h3>
            {ad.subcategory && (
            <p className="text-[11px] text-muted-foreground truncate">
                {ad.subcategory}
            </p>
            )}
            <p className="text-sm font-bold text-primary mt-0.5">
            ₹{ad.price.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-auto pt-1">{ad.location}</p>
        </CardContent>
        </Card>
    </Link>
  );
}

type AdCardProps = {
  ad: Ad;
};
