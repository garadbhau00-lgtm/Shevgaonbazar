
'use client';

import { useRef, useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X as XIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Ad, AdSubmission } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { villageList } from '@/lib/villages';
import { categories } from '@/lib/categories';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// --- PAYMENT CONFIGURATION ---
const UPI_ID = '9545886257@ybl';
const PAYEE_NAME = 'Shevgaon Bazar';
const PAYMENT_AMOUNT = '10.00';
// ---------------------------

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
  title: z.string().min(3, { message: 'जाहिरातीचे शीर्षक किमान ३ अक्षरी असावे.' }).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: 'किंमत ० पेक्षा जास्त असावी.' }),
  location: z.string({ required_error: 'कृपया एक गाव निवडा.' }),
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: 'कृपया वैध १०-अंकी मोबाईल नंबर टाका.' }),
});

type AdFormValues = z.infer<typeof adSchema>;

type AdFormProps = {
    existingAd?: Ad;
};

const MAX_FILES = 1;

export default function AdForm({ existingAd }: AdFormProps) {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const adDataToSubmit = useRef<AdSubmission | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!existingAd;

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      price: undefined,
      location: undefined,
      mobileNumber: '',
      category: undefined,
      subcategory: undefined,
      title: '',
      description: '',
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
        title: existingAd.title,
        description: existingAd.description,
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
      return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
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
    if (!user || !userProfile) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to post an ad.' });
        return;
    }
    if (!isEditMode && photoPreviews.length === 0) {
      toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया तुमच्या जाहिरातीसाठी किमान एक फोटो अपलोड करा.' });
      return;
    }

    setIsSubmitting(true);
    let photoUrl = (isEditMode && existingAd?.photos?.[0]) || '';
    
    try {
        if (newFiles.length > 0) {
            const file = newFiles[0];
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            });
            photoUrl = await imageCompression.getDataUrlFromFile(compressedFile);
        }

        const submissionData: AdSubmission = {
            ...data,
            photos: [photoUrl], // Use the processed data URI
            userId: user.uid,
            userName: userProfile.name || user.email!,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        adDataToSubmit.current = submissionData;

        if (isEditMode) {
          // If editing, just process the submission directly without payment
          await processAdSubmission();
        } else {
          // If new ad, show payment options
          setShowPaymentChoice(true);
        }

    } catch (error) {
        console.error("Error preparing ad data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'There was a problem preparing your ad.' });
        setIsSubmitting(false);
    }
  };
  
  const processAdSubmission = async () => {
    if (!adDataToSubmit.current) return;
    setIsSubmitting(true);
    
    try {
      let finalPhotoUrls: string[] = [];
      const photoData = adDataToSubmit.current.photos[0];

      if (photoData.startsWith('data:image')) {
        // It's a new base64 image, upload to Storage
        const storageRef = ref(storage, `ad_photos/${user!.uid}/${Date.now()}`);
        const uploadResult = await uploadString(storageRef, photoData, 'data_url');
        finalPhotoUrls = [await getDownloadURL(uploadResult.ref)];
      } else {
        // It's an existing URL, keep it
        finalPhotoUrls = [photoData];
      }

      const finalData = { ...adDataToSubmit.current, photos: finalPhotoUrls };

      if (isEditMode && existingAd) {
          const adDocRef = doc(db, 'ads', existingAd.id);
          await updateDoc(adDocRef, { ...finalData, status: 'pending' });
          toast({ title: 'यशस्वी!', description: 'तुमची जाहिरात यशस्वीरित्या अद्यतनित झाली आहे आणि पुनरावलोकनासाठी सबमिट केली आहे.' });
          router.push('/my-ads');
      } else {
          await addDoc(collection(db, 'ads'), finalData);
          toast({ title: 'यशस्वी!', description: 'तुमची जाहिरात यशस्वीरित्या सबमिट झाली आहे. मंजुरीनंतर ती थेट दिसेल.' });
          router.push('/my-ads');
      }
    } catch (error) {
        console.error('Error submitting ad:', error);
        toast({ variant: 'destructive', title: 'त्रुटी', description: 'जाहिरात सबमिट करण्यात अयशस्वी.' });
    } finally {
        setIsSubmitting(false);
        adDataToSubmit.current = null;
        setShowPaymentConfirm(false);
    }
  };

  const handlePaymentRedirect = (gateway: 'phonepe' | 'gpay') => {
      const transactionId = `T${Date.now()}`;
      const note = `Ad posting fee for Shevgaon Bazar.`;
      const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${PAYMENT_AMOUNT}&cu=INR&tn=${encodeURIComponent(note)}&tr=${transactionId}`;

      let gatewayUrl;
      if (gateway === 'phonepe') {
          gatewayUrl = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${PAYMENT_AMOUNT}&cu=INR&tn=${encodeURIComponent(note)}&tr=${transactionId}`;
      } else { // gpay
          gatewayUrl = upiUrl;
      }
      
      window.location.href = gatewayUrl;

      // Close the choice dialog and show the confirmation dialog
      setShowPaymentChoice(false);
      setTimeout(() => {
        setShowPaymentConfirm(true);
      }, 1000); // Give browser time to switch apps
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

          {subcategories && subcategories.length > 0 ? (
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
          ) : null}

          <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>जाहिरातीचे शीर्षक (वैकल्पिक)</FormLabel>
                      <FormControl>
                          <Input placeholder="उदा. विक्रीसाठी चांगली काळी म्हैस" {...field} disabled={isLoading} />
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
                      <FormLabel>वर्णन (वैकल्पिक)</FormLabel>
                      <FormControl>
                           <Input placeholder="तुमच्या उत्पादनाबद्दल अधिक सांगा" {...field} disabled={isLoading} />
                      </FormControl>
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
              {isEditMode ? 'जाहिरात अद्यतनित करा' : `₹${PAYMENT_AMOUNT} भरून जाहिरात पोस्ट करा`}
          </Button>
        </form>
      </Form>

      {/* Payment Choice Dialog */}
       <AlertDialog open={showPaymentChoice} onOpenChange={setShowPaymentChoice}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>पेमेंट पद्धत निवडा</AlertDialogTitle>
                    <AlertDialogDescription>
                        जाहिरात पोस्ट करण्यासाठी तुम्हाला ₹{PAYMENT_AMOUNT} भरावे लागतील. कृपया तुमची पसंतीची UPI ॲप निवडा.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button onClick={() => handlePaymentRedirect('phonepe')} size="lg">PhonePe ने पेमेंट करा</Button>
                    <Button onClick={() => handlePaymentRedirect('gpay')} size="lg" variant="outline">Google Pay ने पेमेंट करा</Button>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsSubmitting(false)}>रद्द करा</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Payment Confirmation Dialog */}
        <AlertDialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>पेमेंटची पुष्टी करा</AlertDialogTitle>
                    <AlertDialogDescription>
                        तुम्ही पेमेंट पूर्ण केले आहे का? पेमेंट यशस्वी झाल्यावर, तुमची जाहिरात पुनरावलोकनासाठी सबमिट केली जाईल.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>लक्ष द्या</AlertTitle>
                  <AlertDescription>
                    पेमेंट अयशस्वी झाल्यास, कृपया 'रद्द करा' बटण दाबा.
                  </AlertDescription>
                </Alert>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setIsSubmitting(false);
                      setShowPaymentConfirm(false);
                    }}>रद्द करा</AlertDialogCancel>
                    <AlertDialogAction onClick={processAdSubmission} disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        होय, पेमेंट पूर्ण झाले
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    