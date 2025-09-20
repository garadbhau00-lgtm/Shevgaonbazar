import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type AdCardProps = {
  ad: Ad;
};

function getAdImageHint(adPhotoUrl: string) {
    const foundImage = PlaceHolderImages.find((p) => p.imageUrl === adPhotoUrl);
    return foundImage ? foundImage.imageHint : 'agriculture';
}

export default function AdCard({ ad }: AdCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3]">
        {ad.photos && ad.photos.length > 0 && (
            <Image
              src={ad.photos[0]}
              alt={ad.title}
              fill
              className="object-cover"
              data-ai-hint={getAdImageHint(ad.photos[0])}
            />
        )}
      </div>
      <CardContent className="flex-grow p-3">
        <h3 className="font-semibold truncate">{ad.title}</h3>
        <p className="text-lg font-bold text-primary">₹{ad.price.toLocaleString('en-IN')}</p>
        <p className="text-xs text-muted-foreground truncate">{ad.location}</p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button className="w-full" size="sm">
          तपशील पहा
        </Button>
      </CardFooter>
    </Card>
  );
}
