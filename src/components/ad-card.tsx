import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Ad } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function getAdImageHint(adPhotoUrl?: string) {
    if (!adPhotoUrl) return 'agriculture';
    const foundImage = PlaceHolderImages.find((p) => p.imageUrl === adPhotoUrl);
    return foundImage ? foundImage.imageHint : 'agriculture';
}

export default function AdCard({ ad }: AdCardProps) {
  const adPhotoUrl = ad.photos?.[0];
  const imageHint = getAdImageHint(adPhotoUrl);

  return (
    <Card className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3]">
        {adPhotoUrl && (
            <Image
              src={adPhotoUrl}
              alt={ad.title}
              fill
              className="object-cover"
              data-ai-hint={imageHint}
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

type AdCardProps = {
  ad: Ad;
};
