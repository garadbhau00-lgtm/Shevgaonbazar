
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
import { Loader2, Sparkles, Upload, X as XIcon } from 'lucide-react';
import { suggestAdDescription } from '@/ai/flows/ad-description-suggester';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
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

async function createAdAction(
    data: AdFormValues,
    userId: string,
    files: File[],
    onProgress: (percentage: number) => void
) {
    if (!userId) {
        return { success: false, message: 'तुम्ही लॉग इन केलेले नाही.' };
    }
    if (files.length === 0) {
        return { success: false, message: 'कृपया किमान एक फोटो अपलोड करा.' };
    }

    try {
        const photoURLs = await new Promise<string[]>((resolve, reject) => {
            const urls: string[] = [];
            let uploadedCount = 0;
            let totalBytesTransferred = 0;
            const totalBytes = files.reduce((acc, file) => acc + file.size, 0);

            files.forEach((file, index) => {
                const storageRef = ref(storage, `ad-photos/${userId}/${Date.now()}-${file.name}`);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        // This handler is called multiple times for each file.
                        // We need a way to track total progress across all files.
                        // For simplicity now, we will just update a global progress.
                        // A more robust solution might track each file's progress individually.
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload is ${progress}% done for file ${index}`);
                    },
                    (error) => {
                        console.error("Upload failed for a file:", error);
                        reject(new Error('एक किंवा अधिक फोटो अपलोड करण्यात अयशस्वी.'));
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        urls[index] = downloadURL; // Keep order
                        uploadedCount++;

                        // Track total progress
                        totalBytesTransferred += files[index].size;
                        const overallProgress = (totalBytesTransferred / totalBytes) * 100;
                        onProgress(overallProgress);

                        if (uploadedCount === files.length) {
                            resolve(urls);
                        }
                    }
                );
            });
        });

        await addDoc(collection(db, 'ads'), {
            ...data,
            userId: userId,
            status: 'pending',
            createdAt: serverTimestamp(),
            photos: photoURLs,
        });

        return { success: true, message: 'तुमची जाहिरात समीक्षेसाठी पाठवली आहे.' };

    } catch (error) {
        console.error("Error creating ad:", error);
        const errorMessage = error instanceof Error ? error.message : 'जाहिरात तयार करण्यात अयशस्वी.';
        return { success: false, message: errorMessage };
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

  const { isSubmitting } = form.formState;

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
        // Revoke the object URL to free up memory
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
    
    setUploadProgress(0);
    const result = await createAdAction(data, user.uid, files, setUploadProgress);
    setUploadProgress(null);


    if(result.success) {
        toast({
            title: "यशस्वी!",
            description: result.message,
        });
        form.reset();
        setFiles([]);
        setPreviews([]);
        
        setTimeout(() => {
            router.push('/my-ads');
        }, 500);

    } else {
        toast({
            variant: "destructive",
            title: "त्रुटी!",
            description: result.message,
        });
    }
  };

  const isUploading = isSubmitting;

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
                <Input placeholder="उदा. काळी म्हैस विक्रीसाठी" {...field} />
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
                  <Textarea placeholder="तुमच्या उत्पादनाबद्दल सर्व माहिती लिहा..." {...field} className="pr-24" />
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSuggestion}
                      disabled={isAiLoading || isUploading}
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Input type="number" placeholder="उदा. १५०००" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ''} />
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
                <Input placeholder="तुमच्या गावाचे नाव" {...field} />
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
                                disabled={isUploading}
                            >
                                <XIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <FormControl>
                <div 
                    className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-secondary"
                    onClick={() => fileInputRef.current?.click()}
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
                        disabled={files.length >= MAX_FILES || isUploading}
                    />
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>

        {uploadProgress !== null && (
            <div className="space-y-1">
                <p className="text-sm font-medium">अपलोड करत आहे...</p>
                <Progress value={uploadProgress} className="w-full" />
            </div>
        )}

        <Button type="submit" className="w-full !mt-8" size="lg" disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isUploading ? 'पोस्ट करत आहे...' : 'जाहिरात पोस्ट करा'}
        </Button>
      </form>
    </Form>
  );
}

    