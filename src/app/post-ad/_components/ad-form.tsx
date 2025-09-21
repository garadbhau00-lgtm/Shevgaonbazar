
'use client';

import { useRef, useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Upload, X as XIcon } from 'lucide-react';
import { suggestAdDescription } from '@/ai/flows/ad-description-suggester';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/types';
import imageCompression from 'browser-image-compression';

const adSchema = z.object({
  title: z.string().min(5, { message: 'शीर्षकासाठी किमान ५ अक्षरे आवश्यक आहेत.' }),
  description: z.string().min(10, { message: 'वर्णनासाठी किमान १० अक्षरे आवश्यक आहेत.' }),
  category: z.enum(['पशुधन', 'शेती उत्पादन', 'उपकरणे'], {
    required_error: 'कृपया एक श्रेणी निवडा.',
  }),
  price: z.coerce.number().positive({ message: 'किंमत ० पेक्षा जास्त असावी.' }),
  location: z.string().min(2, { message: 'तुमच्या गावाचे नाव टाका.' }),
});

type AdFormValues = z.infer<typeof adSchema>;

type AdFormProps = {
    existingAd?: Ad;
};

const MAX_FILES = 1;

export default function AdForm({ existingAd }: AdFormProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!existingAd;

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: isEditMode ? {
        title: existingAd.title,
        description: existingAd.description,
        category: existingAd.category,
        price: existingAd.price,
        location: existingAd.location,
    } : {
      title: '',
      description: '',
      price: undefined,
      location: '',
    },
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'Please log in to post an ad.' });
        router.push('/login');
    }
  }, [user, authLoading, router, toast]);

  
  useEffect(() => {
    if (isEditMode && existingAd?.photos) {
      setPhotoPreviews(existingAd.photos);
    }
  }, [isEditMode, existingAd]);
  
  useEffect(() => {
    // This effect creates temporary blob URLs for previews.
    // It does not affect the final uploaded file.
    if (newFiles.length > 0) {
      const objectUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(objectUrls);
      
      // Cleanup function to revoke the blob URLs when the component unmounts or files change.
      return () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
      };
    } else if (isEditMode && existingAd?.photos) {
        setPhotoPreviews(existingAd.photos);
    } else {
        setPhotoPreviews([]);
    }
  }, [newFiles, isEditMode, existingAd]);


  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, MAX_FILES);
      setNewFiles(files);
    }
  };

  const removePhoto = (index: number) => {
    // Clear the newly selected files
    setNewFiles([]);
    // Reset the preview to the original ad photos if in edit mode, otherwise clear it
    setPhotoPreviews(isEditMode && existingAd?.photos ? existingAd.photos : []);
    
    // Reset the file input so the user can select the same file again if they want
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSuggestion = async () => {
    const description = form.getValues('description');
    if (description.length < 10) {
      form.setError('description', { type: 'manual', message: 'AI सूचनेसाठी किमान १० अक्षरे आवश्यक आहेत.' });
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await suggestAdDescription({ description });
      form.setValue('description', result.improvedDescription, { shouldValidate: true });
      toast({ title: 'AI ने वर्णन सुधारले आहे!' });
    } catch (error) {
      console.error('AI suggestion failed', error);
      toast({ variant: 'destructive', title: 'AI सूचना अयशस्वी', description: 'कृपया पुन्हा प्रयत्न करा.' });
    } finally {
      setIsAiLoading(false);
    }
  };
  
 const onSubmit = async (data: AdFormValues) => {
    if (!user) return;

    // A photo is required. Check if there are previews (either from existing ad or new files).
    if (photoPreviews.length === 0) {
        toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया एक फोटो निवडा.' });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        let photoUrls: string[] = [];

        if (newFiles.length > 0) {
            // A new file was selected. Compress it and convert to Data URL.
            const imageFile = newFiles[0];
            const options = {
                maxSizeMB: 0.2, // Compress to max 200KB
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };

            try {
                const compressedFile = await imageCompression(imageFile, options);
                const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
                photoUrls = [dataUrl];
                toast({ 
                    title: 'फोटो यशस्वीरित्या कॉम्प्रेस केला',
                    description: `मूळ आकार: ${(imageFile.size / 1024).toFixed(2)} KB, नवीन आकार: ${(compressedFile.size / 1024).toFixed(2)} KB`
                });

            } catch (compressionError) {
                console.error('Image compression failed:', compressionError);
                toast({
                    variant: 'destructive',
                    title: 'फोटो कॉम्प्रेस करण्यात अयशस्वी',
                    description: 'मूळ फोटो अपलोड करण्याचा प्रयत्न करत आहे.',
                });
                // Fallback: try to convert original file to data URL if it's small enough
                 if (imageFile.size < 1024 * 1024) { // 1MB
                    const dataUrl = await imageCompression.getDataUrlFromFile(imageFile);
                    photoUrls = [dataUrl];
                } else {
                    throw new Error("File is too large to be stored directly.");
                }
            }

        } else if (isEditMode && existingAd?.photos) {
            // No new file, preserve the existing photo URLs in edit mode.
            photoUrls = existingAd.photos;
        }
       
        const adData = {
            ...data,
            photos: photoUrls,
            status: 'pending' as const,
            rejectionReason: '',
        };

        if (isEditMode && existingAd) {
            const adDocRef = doc(db, 'ads', existingAd.id);
            await updateDoc(adDocRef, { ...adData, updatedAt: serverTimestamp() });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पुन्हा पाठवली आहे." });
        } else {
            await addDoc(collection(db, 'ads'), {
                ...adData,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पाठवली आहे." });
        }
        router.push('/my-ads');
    } catch (error: any) {
        console.error("Submission failed:", error);
         let errorMessage = "जाहिरात सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.";
         if (error.message.includes('resource exhausted') || error.message.includes('too large')) {
             errorMessage = "फोटो खूप मोठा आहे. कृपया लहान आकाराचा फोटो निवडा.";
         }
        toast({
            variant: "destructive",
            title: "त्रुटी!",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>शीर्षक</FormLabel>
              <FormControl>
                <Input placeholder="उदा. काळी म्हैस विक्रीसाठी" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>वर्णन</FormLabel>
                <div className="relative">
                  <Textarea placeholder="तुमच्या उत्पादनाबद्दल सर्व माहिती लिहा..." {...field} className="pr-24" disabled={isSubmitting} />
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSuggestion}
                      disabled={isAiLoading || isSubmitting}
                      className="absolute bottom-2 right-2 flex items-center gap-1 text-primary hover:text-primary"
                  >
                      {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>सुचवा</span>
                  </Button>
                </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>श्रेणी</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="एक श्रेणी निवडा" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="पशुधन">पशुधन</SelectItem>
                  <SelectItem value="शेती उत्पादन">शेती उत्पादन</SelectItem>
                  <SelectItem value="उपकरणे">उपकरणे</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>किंमत (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="उदा. १५०००" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} value={field.value ?? ''} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>गाव</FormLabel>
              <FormControl>
                <Input placeholder="तुमच्या गावाचे नाव" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
            <FormLabel>फोटो</FormLabel>
            <div className="flex flex-wrap gap-4">
                {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative w-32 aspect-square">
                        <Image src={preview} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                            onClick={() => removePhoto(index)}
                            disabled={isSubmitting}
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                {photoPreviews.length < MAX_FILES && (
                    <FormControl>
                        <div 
                            className={cn(
                                "flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                               isSubmitting ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary hover:bg-secondary"
                            )}
                            onClick={() => !isSubmitting && fileInputRef.current?.click()}
                        >
                             <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground text-center">फोटो अपलोड करा</p>
                            <Input 
                                ref={fileInputRef}
                                type="file"
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                disabled={isSubmitting}
                                multiple={false}
                            />
                        </div>
                    </FormControl>
                )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">तुम्ही {MAX_FILES} फोटो अपलोड करू शकता.</p>
            <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full !mt-8" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? (isEditMode ? 'अद्यतनित करत आहे...' : 'पोस्ट करत आहे...') : (isEditMode ? 'जाहिरात अद्यतनित करा' : 'जाहिरात पोस्ट करा')}
        </Button>
      </form>
    </Form>
  );
}

    