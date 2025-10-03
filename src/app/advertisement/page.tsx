'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import type { Advertisement } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdvertisementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [ad, setAd] = useState<Advertisement | null>(null);
    const [newAdPreview, setNewAdPreview] = useState<string | null>(null);
    const [newAdFile, setNewAdFile] = useState<File | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading) {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this resource.' });
                router.push('/more');
                return;
            }

            const fetchAdvertisement = async () => {
                try {
                    const adDocRef = doc(db, 'config', 'advertisement');
                    const adDocSnap = await getDoc(adDocRef);
                    if (adDocSnap.exists()) {
                        setAd(adDocSnap.data() as Advertisement);
                    }
                } catch (error) {
                    console.error("Error fetching advertisement:", error);
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch current advertisement.' });
                } finally {
                    setPageLoading(false);
                }
            };

            fetchAdvertisement();
        }
    }, [authLoading, userProfile, router, toast]);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setNewAdFile(file);
            const previewUrl = URL.createObjectURL(file);
            setNewAdPreview(previewUrl);
        }
    };

    const handleSave = async () => {
        if (!newAdFile) {
            toast({ variant: 'destructive', title: 'No Image Selected', description: 'Please select an image to upload.' });
            return;
        }

        setIsUploading(true);
        try {
            const compressedFile = await imageCompression(newAdFile, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            });
            
            const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);

            const adDocRef = doc(db, 'config', 'advertisement');
            const adData: Advertisement = { 
                imageUrl: dataUrl,
                enabled: ad?.enabled ?? true,
                lastUpdated: new Date()
            };

            setDoc(adDocRef, adData, { merge: true })
                .then(() => {
                    setAd(adData);
                    setNewAdPreview(null);
                    setNewAdFile(null);
                    toast({ title: 'Success', description: 'Advertisement updated successfully.' });
                })
                .catch((serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: adDocRef.path,
                        operation: 'write',
                        requestResourceData: adData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                })
                .finally(() => {
                    setIsUploading(false);
                });

        } catch (error) {
            console.error("Error processing advertisement image:", error);
            toast({ variant: 'destructive', title: 'Image Processing Failed', description: 'There was an error processing the image.' });
            setIsUploading(false);
        }
    };

    const handleToggleEnabled = async (checked: boolean) => {
        if (!ad) return;
        
        const adDocRef = doc(db, 'config', 'advertisement');
        const updatedAd = { ...ad, enabled: checked };
        setAd(updatedAd); // Optimistic update

        try {
            await updateDoc(adDocRef, { enabled: checked });
            toast({ title: 'Success', description: `Advertisement ${checked ? 'enabled' : 'disabled'}.` });
        } catch (serverError) {
            setAd(ad); // Revert on error
            const permissionError = new FirestorePermissionError({
                path: adDocRef.path,
                operation: 'update',
                requestResourceData: { enabled: checked },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }
    
    const clearSelection = () => {
        setNewAdPreview(null);
        setNewAdFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (pageLoading) {
         return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/advertisement/1200/400"
                    alt="Advertisement Management"
                    fill
                    className="object-cover"
                    data-ai-hint="megaphone billboard"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">Advertisement Management</h1>
                    <p className="mt-2 text-xs max-w-xl">Upload and manage the app-wide advertisement.</p>
                </div>
            </div>
             <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Advertisement</CardTitle>
                        <CardDescription>This image is currently shown to users when they open the app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ad?.imageUrl ? (
                            <div className="relative aspect-video w-full max-w-xs mx-auto rounded-lg overflow-hidden bg-secondary">
                                <Image src={ad.imageUrl} alt="Current Advertisement" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                                No advertisement is currently set.
                            </div>
                        )}
                    </CardContent>
                    {ad?.imageUrl && (
                        <CardContent>
                            <div className="flex items-center space-x-2 justify-center">
                                <Switch 
                                  id="ad-enabled" 
                                  checked={ad.enabled}
                                  onCheckedChange={handleToggleEnabled}
                                />
                                <Label htmlFor="ad-enabled">{ad.enabled ? 'Enabled' : 'Disabled'}</Label>
                            </div>
                        </CardContent>
                    )}
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Upload New Advertisement</CardTitle>
                        <CardDescription>Select a new image to replace the current one. Recommended aspect ratio is 9:16 (portrait).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                        {newAdPreview ? (
                            <div className="relative w-full max-w-xs mx-auto aspect-video rounded-lg overflow-hidden bg-secondary">
                                <Image src={newAdPreview} alt="New Ad Preview" fill className="object-contain" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                  onClick={clearSelection}
                                  disabled={isUploading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                             <div
                                className={cn(
                                "flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                                isUploading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary hover:bg-secondary"
                                )}
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 text-sm font-semibold text-muted-foreground">Click to upload image</p>
                                <p className="mt-1 text-xs text-muted-foreground">Portrait image (9:16) recommended</p>
                            </div>
                        )}
                         <Button onClick={handleSave} disabled={isUploading || !newAdFile} className="w-full">
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save and Publish
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
