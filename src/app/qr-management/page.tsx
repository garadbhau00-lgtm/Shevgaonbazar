
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';

type PaymentConfig = {
    qrCodeUrl: string;
    upiId: string;
};

export default function QrManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [config, setConfig] = useState<PaymentConfig>({ qrCodeUrl: '', upiId: '' });
    const [newQrImage, setNewQrImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'तुमच्याकडे ही संसाधने पाहण्याची परवानगी नाही.' });
                router.push('/more');
                return;
            }

            try {
                const configDocRef = doc(db, 'config', 'payment');
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as PaymentConfig;
                    setConfig(data);
                    if (data.qrCodeUrl) {
                        setPreviewUrl(data.qrCodeUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching payment config:", error);
                toast({ variant: 'destructive', title: 'त्रुटी', description: 'कॉन्फिगरेशन आणण्यात अयशस्वी.' });
            } finally {
                setPageLoading(false);
            }
        };

        if (!authLoading) {
            fetchConfig();
        }
    }, [authLoading, userProfile, router, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewQrImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let newQrCodeUrl = config.qrCodeUrl;

            if (newQrImage) {
                 const options = {
                    maxSizeMB: 0.2,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(newQrImage, options);
                const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);

                const storageRef = ref(storage, `config/payment_qr.png`);
                await uploadString(storageRef, dataUrl, 'data_url');
                newQrCodeUrl = await getDownloadURL(storageRef);
            }

            const newConfig = {
                upiId: config.upiId,
                qrCodeUrl: newQrCodeUrl,
            };

            const configDocRef = doc(db, 'config', 'payment');
            await setDoc(configDocRef, newConfig);

            setConfig(newConfig);
            setPreviewUrl(newConfig.qrCodeUrl);
            setNewQrImage(null);

            toast({ title: 'यशस्वी', description: 'पेमेंट सेटिंग्ज यशस्वीरित्या अद्यतनित झाली आहेत.' });
        } catch (error) {
            console.error("Error updating config:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'सेटिंग्ज अद्यतनित करण्यात अयशस्वी.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || pageLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="relative h-28 w-full">
                <AppHeader />
                <Image
                    src="https://picsum.photos/seed/qr-management/1200/400"
                    alt="QR Management background"
                    fill
                    className="object-cover"
                    data-ai-hint="payment settings"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">QR व्यवस्थापन</h1>
                    <p className="mt-2 text-xs max-w-xl">जाहिरात पोस्टिंगसाठी QR कोड आणि UPI आयडी व्यवस्थापित करा.</p>
                </div>
            </div>
            <main className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>पेमेंट सेटिंग्ज</CardTitle>
                        <CardDescription>येथे अपलोड केलेला QR कोड आणि UPI आयडी जाहिरात पोस्ट करताना वापरकर्त्यांना दिसेल.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="upiId">UPI आयडी</Label>
                                <Input
                                    id="upiId"
                                    value={config.upiId}
                                    onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                                    placeholder="उदा. yourname@upi"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>QR कोड इमेज</Label>
                                <div className="flex items-center gap-4">
                                    {previewUrl && (
                                        <Image src={previewUrl} alt="QR Code Preview" width={100} height={100} className="rounded-md border" />
                                    )}
                                    <Button type="button" variant="outline" onClick={() => document.getElementById('qr-upload')?.click()} disabled={isSubmitting}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {previewUrl ? 'नवीन इमेज अपलोड करा' : 'इमेज अपलोड करा'}
                                    </Button>
                                    <Input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                सेटिंग्ज जतन करा
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
