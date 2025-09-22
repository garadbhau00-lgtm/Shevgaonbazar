
'use client';

import { useRef, useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Upload, X as XIcon, BadgeIndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { villageList } from '@/lib/villages';
import { categories } from '@/lib/categories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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
const DEFAULT_UPI_ID = '9545886257';

export default function AdForm({ existingAd }: AdFormProps) {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AdFormValues | null>(null);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState<boolean | null>(null);

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
    },
  });

  const selectedCategory = useWatch({
    control: form.control,
    name: 'category',
  });

  useEffect(() => {
    const fetchPaymentSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'config', 'settings'));
            if (settingsDoc.exists()) {
                setIsPaymentEnabled(settingsDoc.data().isPaymentEnabled);
            } else {
                setIsPaymentEnabled(false); // Default to false if not set
            }
        } catch (error) {
            console.error("Error fetching payment settings:", error);
            setIsPaymentEnabled(false); // Default to false on error
        }
    };
    fetchPaymentSettings();
  }, []);

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
      if (existingAd.photos) {
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
    // Reset subcategory when main category changes
    if (!form.formState.isSubmitted) {
        form.setValue('subcategory', undefined);
    }
  }, [selectedCategory, form]);


  if (authLoading || isPaymentEnabled === null) {
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
    setPhotoPreviews(isEditMode && existingAd?.photos ? existingAd.photos : []);
    
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
 const handleFormSubmit = async (data: AdFormValues) => {
    if (photoPreviews.length === 0) {
        toast({ variant: 'destructive', title: 'फोटो आवश्यक', description: 'कृपया एक फोटो निवडा.' });
        return;
    }

    if (isEditMode || !isPaymentEnabled) {
      await processAdSubmission(data);
    } else {
      setFormData(data);
      setIsPaymentDialogOpen(true);
    }
 };
 
 const handlePaymentConfirm = async () => {
    if (formData) {
        await processAdSubmission(formData);
    }
 };
 
 const processAdSubmission = async (data: AdFormValues) => {
    if (!user || !userProfile) return;
    
    setIsSubmitting(true);
    setIsPaymentDialogOpen(false);
    
    try {
        let finalPhotoUrls: string[] = [];
        let hasNewUpload = newFiles.length > 0;

        if (hasNewUpload) {
            const imageFile = newFiles[0];
            const options = {
                maxSizeMB: 0.2, // Compress to max 200KB
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };

            try {
                const compressedFile = await imageCompression(imageFile, options);
                const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
                finalPhotoUrls = [dataUrl];
            } catch (compressionError) {
                console.error('Image compression failed:', compressionError);
                toast({
                    variant: 'destructive',
                    title: 'फोटो कॉम्प्रेस करण्यात अयशस्वी',
                    description: 'एक मोठी त्रुटी आली. कृपया लहान आकाराचा फोटो निवडा.',
                });
                setIsSubmitting(false);
                return; 
            }
        } else if (isEditMode && existingAd?.photos) {
            finalPhotoUrls = existingAd.photos;
        }
       
        const generatedTitle = data.subcategory ? `${data.category} - ${data.subcategory}` : data.category;

        const adData = {
            ...data,
            title: generatedTitle,
            userName: userProfile.name || user.email,
            description: '',
            photos: finalPhotoUrls,
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
        
        // Sync mobile number back to user profile if it's different
        if (data.mobileNumber && data.mobileNumber !== userProfile.mobileNumber) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, { mobileNumber: data.mobileNumber });
        }

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
        setFormData(null);
    }
};

  const subcategories = selectedCategory ? categories.find(c => c.name === selectedCategory)?.subcategories : [];
  
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
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="एक उप-श्रेणी निवडा" />
                      </Trigger>
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
            )}

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
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                  <Input type="tel" placeholder="तुमचा मोबाईल नंबर" {...field} disabled={isSubmitting}/>
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

       <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>पेमेंट सूचना</AlertDialogTitle>
                <AlertDialogDescription>
                   post your ad please pay 10rupees once payment done your ad will approved
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-lg bg-secondary p-4">
                <p className="text-sm text-muted-foreground">यावर पेमेंट करा:</p>
                <p className="font-mono font-semibold text-lg">{DEFAULT_UPI_ID}</p>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFormData(null)} disabled={isSubmitting}>
                    रद्द करा
                </AlertDialogCancel>
                <AlertDialogAction onClick={handlePaymentConfirm} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    पेमेंटची पुष्टी करा आणि पोस्ट करा
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
