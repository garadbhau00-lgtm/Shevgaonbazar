
'use client';

import { useRef, useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { villageList } from '@/lib/villages';
import { categories } from '@/lib/categories';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const adSchema = z.object({
  category: z.enum(
    [
      'पशुधन',
      'शेती उत्पादने',
      'शेतीसाठी साधनं',
      'शेती व गाव सेवा',
      'गावातील गरज',
      'व्यावसायिक सेवा',
      'आर्थिक',
    ],
    {
      required_error: 'कृपया एक श्रेणी निवडा.',
    }
  ),
  subcategory: z.string().optional(),
  price: z.coerce.number().positive({ message: 'किंमत ० पेक्षा जास्त असावी.' }),
  location: z.string({ required_error: 'कृपया एक गाव निवडा.' }),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: 'कृपया वैध १०-अंकी मोबाईल नंबर टाका.' }),
});

type AdFormValues = z.infer<typeof adSchema>;

type AdFormProps = {
    existingAd?: Ad;
};

const MAX_FILES = 1;
const UPI_ID = '9545886257@ybl';
const PAYEE_NAME = 'Shevgaon Bazar';
const PAYMENT_AMOUNT = '10.00';

export default function AdForm({ existingAd }: AdFormProps) {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const adDataToSubmit = useRef<Omit<Ad, 'id' | 'createdAt' | 'updatedAt'> | null>(null);

  const isEditMode = !!existingAd;

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      price: undefined,
      location: undefined,
      mobileNumber: '',
      category: undefined,
      subcategory: undefined,
    },
  });

  const selectedCategory = useWatch({
    control: form.control,
    name: 'category',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'जाहिरात पोस्ट करण्यासाठी कृपया लॉगिन करा.' });
        router.push('/login');
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    if (isEditMode && existingAd) {
      form.reset({
        category: existingAd.category,
        subcategory: existingAd.subcategory,
        price: existingAd.price,
        location: existingAd.location,
        mobileNumber: existingAd.mobileNumber,
      });
      if (existingAd.photos && existingAd.photos.length > 0) {
        setPhotoPreviews(existingAd.photos);
      }
    } else if (userProfile) {
       form.setValue('mobileNumber', userProfile.mobileNumber || '');
    }
  }, [isEditMode, existingAd, userProfile, form]);
  
  useEffect(() => {
    if (newFiles.length > 0) {
      const objectUrls = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(objectUrls);
      
      return () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
      };
    } else if (isEditMode && existingAd?.photos) {
        setPhotoPreviews(existingAd.photos);
    } else {
        setPhotoPreviews([]);
    }
  }, [newFiles, isEditMode, existingAd]);

  useEffect(() => {
    form.setValue('subcategory', undefined);
  }, [selectedCategory, form]);


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

  const removePhoto = () => {
    setNewFiles([]);
    setPhotoPreviews([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
 const handleFormSubmit = async (data: AdFormValues) => {
    setIsSubmitting(true);
    let finalPhotoUrl: string | null = (isEditMode && existingAd?.photos?.[0]) || null;
    
    if (newFiles.length > 0) {
        try {
            const compressedFile = await imageCompression(newFiles[0], {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
            });
            finalPhotoUrl = await imageCompression.getDataUrlFromFile(compressedFile);
        } catch (error) {
            console.error("Image compression failed:", error);
            toast({ variant: 'destructive', title: 'फोटो एरर', description: 'फोटोवर प्रक्रिया करण्यात अयशस्वी.' });
            setIsSubmitting(false);
            return;
        }
    }
    
    if (!finalPhotoUrl) {
        toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया एक फोटो निवडा.' });
        setIsSubmitting(false);
        return;
    }
    
    if (!user || !userProfile) {
       toast({ variant: 'destructive', title: 'त्रुटी', description: 'वापरकर्ता प्रमाणीकरण अयशस्वी झाले.' });
       setIsSubmitting(false);
       return;
    }

    const generatedTitle = data.subcategory ? `${data.category} - ${data.subcategory}` : data.category;
    
    adDataToSubmit.current = {
        userId: user.uid,
        userName: userProfile.name || user.email || 'Unknown User',
        title: generatedTitle,
        description: '',
        status: 'pending' as const,
        rejectionReason: '',
        ...data,
        photos: [finalPhotoUrl],
    };
    
    setIsSubmitting(false);

    if (isEditMode) {
      await processAdSubmission();
    } else {
      setShowPaymentChoice(true);
    }
 };

 const handlePaymentRedirect = (app: 'phonepe' | 'gpay') => {
    setShowPaymentChoice(false);
    
    const transactionNote = `AdPost-${user?.uid.slice(0, 5)}-${Date.now()}`;
    let upiUrl = '';

    if (app === 'phonepe') {
        upiUrl = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${PAYMENT_AMOUNT}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    } else if (app === 'gpay') {
        upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${PAYMENT_AMOUNT}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    }

    toast({
        title: 'पेमेंट ॲपवर रीडायरेक्ट करत आहे...',
        description: 'पेमेंटनंतर कृपया या पेजवर परत या आणि सबमिशनची पुष्टी करा.',
        duration: 8000,
    });

    window.location.href = upiUrl;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setShowConfirmation(true);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
 };
 
 const processAdSubmission = async () => {
    setShowConfirmation(false);
    const dataToSubmit = adDataToSubmit.current;
    if (!user || !userProfile || !dataToSubmit || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
        if (isEditMode && existingAd) {
            const adDocRef = doc(db, 'ads', existingAd.id);
            await updateDoc(adDocRef, { ...dataToSubmit, updatedAt: serverTimestamp() });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पुन्हा पाठवली आहे." });
        } else {
            await addDoc(collection(db, 'ads'), {
                ...dataToSubmit,
                createdAt: serverTimestamp(),
            });
            toast({ title: "यशस्वी!", description: "तुमची जाहिरात समीक्षेसाठी पाठवली आहे." });
        }
        
        if (dataToSubmit.mobileNumber && dataToSubmit.mobileNumber !== userProfile.mobileNumber) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { mobileNumber: dataToSubmit.mobileNumber });
        }
        adDataToSubmit.current = null;
        router.push('/my-ads');
    } catch (error: any) {
        console.error("Submission failed:", error);
         let errorMessage = "जाहिरात सबमिट करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.";
         if (error.code === 'resource-exhausted' || error.message.includes('too large')) {
             errorMessage = "फोटो खूप मोठा आहे. कृपया लहान आकाराचा फोटो निवडा.";
         } else if (error.code === 'permission-denied') {
             errorMessage = "जाहिरात सेव्ह करण्यासाठी परवानगी नाही. कृपया तुमच्या फायरस्टोअर नियमांची तपासणी करा.";
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

  const subcategories = selectedCategory ? categories.find(c => c.name === selectedCategory)?.subcategories : [];
  const isLoading = isSubmitting;
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>श्रेणी</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="एक श्रेणी निवडा" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {subcategories && subcategories.length > 0 && (
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>उप-श्रेणी</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="एक उप-श्रेणी निवडा" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map(subcat => (
                        <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>किंमत (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="उदा. १५०००" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} value={field.value ?? ''} disabled={isLoading}/>
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="एक गाव निवडा" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                      {villageList.map((village) => (
                          <SelectItem key={village} value={village}>{village}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>मोबाईल नंबर</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="तुमचा मोबाईल नंबर" {...field} disabled={isLoading}/>
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
                              onClick={() => removePhoto()}
                              disabled={isLoading}
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
                                isLoading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary hover:bg-secondary"
                              )}
                              onClick={() => !isLoading && fileInputRef.current?.click()}
                          >
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground text-center">फोटो अपलोड करा</p>
                              <Input 
                                  ref={fileInputRef}
                                  type="file"
                                  className="hidden" 
                                  accept="image/*" 
                                  onChange={handleFileChange} 
                                  disabled={isLoading}
                                  multiple={false}
                              />
                          </div>
                      </FormControl>
                  )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">तुम्ही {MAX_FILES} फोटो अपलोड करू शकता.</p>
              <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full !mt-8" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? (isEditMode ? 'अद्यतनित करत आहे...' : 'पोस्ट करत आहे...') : (isEditMode ? 'जाहिरात अद्यतनित करा' : 'जाहिरात पोस्ट करा')}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showPaymentChoice} onOpenChange={setShowPaymentChoice}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>पेमेंट पद्धत निवडा</AlertDialogTitle>
                <AlertDialogDescription>
                    तुमची जाहिरात पोस्ट करण्यासाठी कृपया ₹१० चे पेमेंट पूर्ण करा.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handlePaymentRedirect('phonepe')}>
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" width={80} height={25} />
                    PhonePe
                </Button>
                 <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handlePaymentRedirect('gpay')}>
                    <Image src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" width={60} height={25} />
                    Google Pay
                </Button>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>रद्द करा</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>सबमिशनची पुष्टी करा</AlertDialogTitle>
                <AlertDialogDescription>
                    तुम्ही पेमेंट पूर्ण केले असल्यास, कृपया जाहिरात पोस्ट करण्यासाठी 'पुष्टी करा' बटण दाबा. तुम्ही पेमेंट रद्द केले असल्यास, 'रद्द करा' दाबा.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => adDataToSubmit.current = null} disabled={isSubmitting}>रद्द करा</AlertDialogCancel>
                <AlertDialogAction onClick={processAdSubmission} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    पुष्टी करा
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    