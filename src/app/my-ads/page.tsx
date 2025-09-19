import AppHeader from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { mockAds } from '@/lib/data';
import type { Ad } from '@/lib/types';
import { Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

const getStatusVariant = (status: Ad['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'rejected':
      return 'destructive';
  }
};

const statusTranslations: Record<Ad['status'], string> = {
    approved: 'स्वीकृत',
    pending: 'प्रलंबित',
    rejected: 'नाकारले'
}

export default function MyAdsPage() {
    const myAds = mockAds.filter(ad => ad.userId === 'user1'); // Assuming logged in user is user1

    return (
        <div>
            <AppHeader showUserOptions={false}/>
            <main className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">माझ्या जाहिराती</h1>
                    <p className="text-muted-foreground">तुम्ही पोस्ट केलेल्या सर्व जाहिराती येथे पहा.</p>
                </div>

                {myAds.length > 0 ? (
                    <div className="space-y-4">
                        {myAds.map(ad => (
                            <Card key={ad.id} className="flex items-center">
                                <CardHeader className="p-2">
                                    <Image
                                        src={ad.photos[0]}
                                        alt={ad.title}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover aspect-square"
                                    />
                                </CardHeader>
                                <CardContent className="flex-grow p-3">
                                    <h3 className="font-semibold">{ad.title}</h3>
                                    <p className="text-sm font-bold text-primary">₹{ad.price.toLocaleString('en-IN')}</p>
                                    <Badge variant={getStatusVariant(ad.status)} className="mt-1">
                                        {statusTranslations[ad.status]}
                                    </Badge>
                                </CardContent>
                                <CardFooter className="p-3 space-x-2">
                                    <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex h-64 flex-col items-center justify-center text-center">
                        <p className="text-lg font-semibold text-muted-foreground">
                            तुम्ही अद्याप एकही जाहिरात पोस्ट केलेली नाही.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
