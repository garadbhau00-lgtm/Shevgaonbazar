
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
import { useLanguage } from '@/contexts/language-context';

// --- PAYMENT CONFIGURATION ---
const UPI_ID = 'hari.garad@ybl'; // <-- IMPORTANT: REPLACE THIS WITH YOUR REAL UPI ID
const PAYEE_NAME = 'Shevgaon Bazar';
const PAYMENT_AMOUNT = '15.00';
// ---------------------------

type AdFormProps = {
    existingAd?: Ad;
};

const MAX_FILES = 1;

export default function AdForm({ existingAd }: AdFormProps) {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { dictionary } = useLanguage();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const adDataToSubmit = useRef<AdSubmission | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!existingAd;
  
  const adFormDictionary = dictionary.adForm;

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
        required_error: adFormDictionary.validation.categoryRequired,
      }
    ),
    subcategory: z.string().optional(),
    price: z.coerce.number().positive({ message: adFormDictionary.validation.pricePositive }),
    location: z.string({ required_error: adFormDictionary.validation.locationRequired }),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: adFormDictionary.validation.mobileInvalid }),
  });
  
  type AdFormValues = z.infer<typeof adSchema>;

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
        toast({ variant: 'destructive', title: adFormDictionary.toast.unauthorizedTitle, description: adFormDictionary.toast.unauthorizedDescription });
        router.push('/login');
    }
  }, [user, authLoading, router, toast, adFormDictionary]);

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
        toast({ variant: 'destructive', title: adFormDictionary.toast.errorTitle, description: adFormDictionary.toast.loginRequired });
        return;
    }
    if (!isEditMode && photoPreviews.length === 0) {
      toast({ variant: 'destructive', title: adFormDictionary.toast.photoRequiredTitle, description: adFormDictionary.toast.photoRequiredDescription });
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
            photos: [photoUrl],
            userId: user.uid,
            userName: userProfile.name || user.email!,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        adDataToSubmit.current = submissionData;

        if (isEditMode) {
          await processAdSubmission();
        } else {
          setShowPaymentChoice(true);
        }

    } catch (error) {
        console.error("Error preparing ad data:", error);
        toast({ variant: 'destructive', title: adFormDictionary.toast.errorTitle, description: adFormDictionary.toast.errorPreparingAd });
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
        const storageRef = ref(storage, `ad_photos/${user!.uid}/${Date.now()}`);
        const uploadResult = await uploadString(storageRef, photoData, 'data_url');
        finalPhotoUrls = [await getDownloadURL(uploadResult.ref)];
      } else {
        finalPhotoUrls = [photoData];
      }

      const finalData = { ...adDataToSubmit.current, photos: finalPhotoUrls };

      if (isEditMode && existingAd) {
          const adDocRef = doc(db, 'ads', existingAd.id);
          await updateDoc(adDocRef, { ...finalData, status: 'pending' });
          toast({ title: adFormDictionary.toast.successTitle, description: adFormDictionary.toast.updateSuccess });
          router.push('/my-ads');
      } else {
          await addDoc(collection(db, 'ads'), finalData);
          toast({ title: adFormDictionary.toast.successTitle, description: adFormDictionary.toast.submitSuccess });
          router.push('/my-ads');
      }
    } catch (error) {
        console.error('Error submitting ad:', error);
        toast({ variant: 'destructive', title: adFormDictionary.toast.errorTitle, description: adFormDictionary.toast.submitError });
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
      } else {
          gatewayUrl = upiUrl;
      }
      
      window.location.href = gatewayUrl;

      setShowPaymentChoice(false);
      setTimeout(() => {
        setShowPaymentConfirm(true);
      }, 1000); 
  };


  const subcategories = categories.find(c => c.name === selectedCategory)?.subcategories || [];
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
                <FormLabel>{adFormDictionary.category.label}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={adFormDictionary.category.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.name} value={cat.name}>{dictionary.categories[cat.name] || cat.name}</SelectItem>
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
                  <FormLabel>{adFormDictionary.subcategory.label}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={adFormDictionary.subcategory.placeholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map(subcat => (
                        <SelectItem key={subcat.key} value={subcat.name}>
                            {dictionary.subcategories[subcat.key] || subcat.name}
                        </SelectItem>
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
                <FormLabel>{adFormDictionary.price.label}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder={adFormDictionary.price.placeholder} {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} value={field.value ?? ''} disabled={isLoading}/>
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
                <FormLabel>{adFormDictionary.location.label}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={adFormDictionary.location.placeholder} />
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
                <FormLabel>{adFormDictionary.mobile.label}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={adFormDictionary.mobile.placeholder} {...field} disabled={isLoading}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
              <FormLabel>{adFormDictionary.photo.label}</FormLabel>
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
                              <p className="mt-2 text-sm text-muted-foreground text-center">{adFormDictionary.photo.uploadText}</p>
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
              <p className="text-xs text-muted-foreground mt-1">{adFormDictionary.photo.limitText.replace('${maxFiles}', MAX_FILES.toString())}</p>
              <FormMessage />
          </FormItem>

          <Button type="submit" className="w-full !mt-8" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditMode ? adFormDictionary.updateAdButton : adFormDictionary.postAdButton.replace('${amount}', PAYMENT_AMOUNT)}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showPaymentChoice} onOpenChange={setShowPaymentChoice}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{adFormDictionary.payment.choiceTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {adFormDictionary.payment.choiceDescription.replace('${amount}', PAYMENT_AMOUNT)}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button onClick={() => handlePaymentRedirect('phonepe')} size="lg">{adFormDictionary.payment.phonepeButton}</Button>
                    <Button onClick={() => handlePaymentRedirect('gpay')} size="lg" variant="outline">{adFormDictionary.payment.gpayButton}</Button>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsSubmitting(false)}>{adFormDictionary.payment.cancelButton}</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{adFormDictionary.payment.confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {adFormDictionary.payment.confirmDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{adFormDictionary.payment.attentionTitle}</AlertTitle>
                  <AlertDescription>
                    {adFormDictionary.payment.attentionDescription}
                  </AlertDescription>
                </Alert>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setIsSubmitting(false);
                      setShowPaymentConfirm(false);
                    }}>{adFormDictionary.payment.cancelButton}</AlertDialogCancel>
                    <AlertDialogAction onClick={processAdSubmission} disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {adFormDictionary.payment.confirmButton}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

    