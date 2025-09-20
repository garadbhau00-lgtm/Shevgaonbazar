
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
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { Ad } from '@/lib/types';


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

export default function AdForm({ existingAd }: AdFormProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [existingPhotos, setExistingPhotos] = useState<string[]>(existingAd?.photos || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews([...existingPhotos, ...newFilePreviews]);

    return () => {
        newFilePreviews.forEach(p => URL.revokeObjectURL(p));
    }
  }, [existingPhotos, newFiles]);


  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  if (!user) {
    router.push('/login');
    toast({
        variant: 'destructive',
        title: 'प्रवेश प्रतिबंधित',
        description: isEditMode ? 'जाहिरात संपादित करण्यासाठी कृपया लॉगिन करा.' : 'जाहिरात पोस्ट करण्यासाठी कृपया लॉगिन करा.'
    })
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incomingFiles = Array.from(e.target.files);
      const totalFiles = existingPhotos.length + newFiles.length + incomingFiles.length;
      if (totalFiles > MAX_FILES) {
        toast({ variant: 'destructive', title: `तुम्ही कमाल ${MAX_FILES} फोटो निवडू शकता.` });
        return;
      }
      setNewFiles(prev => [...prev, ...incomingFiles]);
    }
  };

  const removeFile = (index: number) => {
    if (index < existingPhotos.length) {
        setExistingPhotos(current => current.filter((_, i) => i !== index));
    } else {
        const newFileIndex = index - existingPhotos.length;
        setNewFiles(current => current.filter((_, i) => i !== newFileIndex));
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
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

    const uploadFiles = (files: File[], userId: string): Promise<string[]> => {
        setUploadProgress(0);
        const uploadPromises = files.map((file) => {
            return new Promise<string>((resolve, reject) => {
                const fileName = `${userId}-${Date.now()}-${file.name}`;
                const storageRef = ref(storage, `ad-photos/${fileName}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progress function ...
                    },
                    (error) => {
                        console.error("Upload failed for a file:", error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        } catch (error) {
                            console.error("Failed to get download URL:", error);
                            reject(error);
                        }
                    }
                );
            });
        });

        let completed = 0;
        uploadPromises.forEach(p => {
            p.then(() => {
                completed++;
                const overallProgress = (completed / files.length) * 100;
                setUploadProgress(overallProgress);
            });
        });

        return Promise.all(uploadPromises);
    };

  const onSubmit = async (data: AdFormValues) => {
    if (existingPhotos.length + newFiles.length === 0) {
        toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया किमान एक फोटो अपलोड करा.' });
        return;
    }
    
    setIsSubmitting(true);
    
    try {
        let uploadedUrls: string[] = [];
        
        if (newFiles.length > 0) {
            uploadedUrls = await uploadFiles(newFiles, user.uid);
        }
        
        const finalPhotoURLs = [...existingPhotos, ...uploadedUrls];


        if (isEditMode && existingAd) {
            const adDocRef = doc(db, 'ads', existingAd.id);
            await updateDoc(adDocRef, {
                ...data,
                photos: finalPhotoURLs,
                status: 'pending', 
                rejectionReason: '', 
            });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पुन्हा पाठवली आहे." });

        } else {
             await addDoc(collection(db, 'ads'), {
                ...data,
                photos: finalPhotoURLs,
                status: 'pending',
                rejectionReason: '',
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पाठवली आहे." });
        }
        
        router.push('/my-ads');

    } catch (error) {
        console.error("Submission failed:", error);
        toast({
            variant: "destructive",
            title: "त्रुटी!",
            description: isEditMode ? 'जाहिरात अद्यतनित करण्यात अयशस्वी.' : 'जाहिरात सबमिट करण्यात अयशस्वी.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const MAX_FILES = 5;

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
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, index) => {
                        return (
                            <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`Preview ${index}`} fill className="rounded-md object-cover" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                                    onClick={() => removeFile(index)}
                                    disabled={isSubmitting}
                                >
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
            <FormControl>
                <div 
                    className={cn(
                        "flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                        (previews.length >= MAX_FILES || isSubmitting) ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary hover:bg-secondary"
                    )}
                    onClick={() => !(previews.length >= MAX_FILES || isSubmitting) && fileInputRef.current?.click()}
                >
                     <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">फोटो अपलोड करण्यासाठी क्लिक करा</p>
                    <p className="text-xs text-muted-foreground">(कमाल {MAX_FILES})</p>
                    <Input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileChange} 
                        disabled={previews.length >= MAX_FILES || isSubmitting}
                    />
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>

        {isSubmitting && newFiles.length > 0 && (
          <Progress value={uploadProgress} className="w-full" />
        )}
        
        <Button type="submit" className="w-full !mt-8" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? (isEditMode ? 'अद्यतनित करत आहे...' : 'पोस्ट करत आहे...') : (isEditMode ? 'जाहिरात अद्यतनित करा' : 'जाहिरात पोस्ट करा')}
        </Button>
      </form>
    </Form>
  );
}
