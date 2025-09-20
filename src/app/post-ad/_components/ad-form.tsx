
'use client';

import { useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Upload, X as XIcon } from 'lucide-react';
import { suggestAdDescription } from '@/ai/flows/ad-description-suggester';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytesResumable, UploadTask } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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

async function createAd(
    data: AdFormValues & { userId: string; photos: string[] }
): Promise<{ success: boolean; message: string }> {
    try {
        await addDoc(collection(db, 'ads'), {
            ...data,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        return { success: true, message: 'तुमची जाहिरात समीक्षेसाठी पाठवली आहे.' };
    } catch (error) {
        console.error("Error creating ad:", error);
        return { success: false, message: 'जाहिरात तयार करण्यात एक अनपेक्षित त्रुटी आली.' };
    }
}


const MAX_FILES = 5;

export default function AdForm() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: '',
      description: '',
      price: undefined,
      location: '',
    },
  });


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
        description: 'जाहिरात पोस्ट करण्यासाठी कृपया लॉगिन करा.'
    })
    return null;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > MAX_FILES) {
        toast({ variant: 'destructive', title: `तुम्ही कमाल ${MAX_FILES} फोटो निवडू शकता.` });
        return;
      }
      const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
      setFiles(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFilePreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
        const newPreviews = prev.filter((_, i) => i !== index);
        URL.revokeObjectURL(previews[index]);
        return newPreviews;
    });
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

  const onSubmit = async (data: AdFormValues) => {
    if (files.length === 0) {
        toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया किमान एक फोटो अपलोड करा.' });
        return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        const uploadPromises: Promise<string>[] = files.map((file, index) => {
            const storageRef = ref(storage, `ad-photos/${user.uid}/${Date.now()}-${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        // This logic calculates the total progress for all files.
                        // It assumes each file contributes equally to the total progress.
                        // We update a general progress, not per file.
                        // A simple approach is to show the progress of the current file being uploaded,
                        // or average it out. Let's average it.
                        const totalProgress = (index + (progress / 100)) / files.length * 100;
                        setUploadProgress(totalProgress);
                    },
                    (error) => {
                        console.error(`Upload failed for ${file.name}:`, error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        } catch(error) {
                            reject(error);
                        }
                    }
                );
            });
        });
        
        const photoURLs = await Promise.all(uploadPromises);

        const result = await createAd({
            ...data,
            userId: user.uid,
            photos: photoURLs,
        });

        if (result.success) {
            toast({
                title: "यशस्वी!",
                description: result.message,
            });
            form.reset();
            setFiles([]);
            setPreviews([]);
            router.push('/my-ads');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Submission failed:", error);
        toast({
            variant: "destructive",
            title: "त्रुटी!",
            description: 'जाहिरात सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
        });
    } finally {
        setIsSubmitting(false);
        setUploadProgress(null);
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                    {previews.map((src, index) => (
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
                    ))}
                </div>
            )}
            <FormControl>
                <div 
                    className={cn(
                        "flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                        !isSubmitting && "cursor-pointer hover:border-primary hover:bg-secondary"
                    )}
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
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
                        disabled={files.length >= MAX_FILES || isSubmitting}
                    />
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
        
        {isSubmitting && uploadProgress !== null && (
            <div className="space-y-2">
                <Label>{`फोटो अपलोड करत आहे... ${Math.round(uploadProgress)}%`}</Label>
                <Progress value={uploadProgress} />
            </div>
        )}

        <Button type="submit" className="w-full !mt-8" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'पोस्ट करत आहे...' : 'जाहिरात पोस्ट करा'}
        </Button>
      </form>
    </Form>
  );
}

    