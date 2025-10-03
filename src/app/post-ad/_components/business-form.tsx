'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
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
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Ad } from '@/lib/types';
import imageCompression from 'browser-image-compression';
import { talukaVillageMap } from '@/lib/village-data';
import { categories } from '@/lib/categories';
import { useLanguage } from '@/contexts/language-context';
import { talukaList } from '@/lib/talukas';
import { Textarea } from '@/components/ui/textarea';

const MAX_FILES = 1;

export default function BusinessForm() {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { dictionary } = useLanguage();
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const adFormDictionary = dictionary.adForm;

  const businessSchema = z.object({
    subcategory: z.string({ required_error: "Please select a service type."}),
    description: z.string().optional(),
    taluka: z.string({ required_error: adFormDictionary.validation.talukaRequired }),
    location: z.string({ required_error: adFormDictionary.validation.locationRequired }),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/, { message: adFormDictionary.validation.mobileInvalid }),
  });
  
  type BusinessFormValues = z.infer<typeof businessSchema>;

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      taluka: undefined,
      location: undefined,
      mobileNumber: '',
      subcategory: undefined,
      description: '',
    },
  });

  const selectedTaluka = useWatch({
    control: form.control,
    name: 'taluka',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        toast({ variant: 'destructive', title: adFormDictionary.toast.unauthorizedTitle, description: adFormDictionary.toast.unauthorizedDescription });
        router.push('/login');
    }
  }, [user, authLoading, router, toast, adFormDictionary]);

  useEffect(() => {
    if (userProfile) {
       form.setValue('mobileNumber', userProfile.mobileNumber || '');
    }
  }, [userProfile, form]);
  
  useEffect(() => {
    if (user) {
      const fetchLastAdLocation = async () => {
        try {
            const adsRef = collection(db, 'ads');
            const q = query(
              adsRef,
              where('userId', '==', user.uid),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const lastAd = querySnapshot.docs[0].data() as Ad;
              if (lastAd.taluka) {
                form.setValue('taluka', lastAd.taluka);
              }
              if (lastAd.location) {
                form.setValue('location', lastAd.location);
              }
            }
        } catch (error) {
            console.warn("Could not fetch last ad location:", error);
        }
      };

      fetchLastAdLocation();
    }
  }, [user, form]);

  useEffect(() => {
    const generatePreviews = async () => {
        if (newFiles.length > 0) {
            const objectUrls = newFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(objectUrls);
            return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
        }
    };
    generatePreviews();
  }, [newFiles]);

  useEffect(() => {
    form.setValue('location', undefined);
  }, [selectedTaluka, form]);
  
  const villageList = useMemo(() => {
    if (!selectedTaluka) return [];
    return talukaVillageMap[selectedTaluka] || [];
  }, [selectedTaluka]);


  if (authLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewFiles([file]); 
    }
  };

  const removePhoto = () => {
    setNewFiles([]);
    setPhotoPreviews([]);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };
  
  const onSubmit = async (data: BusinessFormValues) => {
    setIsSubmitting(true);
    try {
        if (!user || !userProfile) {
            throw new Error(adFormDictionary.toast.loginRequired);
        }

        if (newFiles.length === 0) {
            toast({ variant: 'destructive', title: adFormDictionary.toast.photoRequiredTitle, description: "कृपया तुमच्या व्यवसायासाठी एक फोटो अपलोड करा." });
            setIsSubmitting(false);
            return;
        }

        let finalPhotoDataUris: string[] = [];

        if (newFiles.length > 0) {
            const file = newFiles[0];
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
                maxIteration: 5,
            });
            const dataUri = await imageCompression.getDataUrlFromFile(compressedFile);
            finalPhotoDataUris = [dataUri];
        }
        
        const submissionData: Omit<Ad, 'id' | 'price'> & { price?: number } = {
            category: 'व्यावसायिक सेवा',
            ...data,
            photos: finalPhotoDataUris,
            userId: user.uid,
            userName: userProfile.name || user.email!,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'ads'), submissionData);
        toast({ title: adFormDictionary.toast.successTitle, description: "तुमचा व्यवसाय यशस्वीरित्या नोंदवला गेला आहे." });
        router.push('/my-ads');

    } catch (error) {
        console.error("Error submitting business:", error);
        toast({ variant: 'destructive', title: adFormDictionary.toast.errorTitle, description: "व्यवसाय नोंदवण्यात अयशस्वी." });
    } finally {
        setIsSubmitting(false);
    }
};

  const serviceSubcategories = categories.find(c => c.name === 'व्यावसायिक सेवा')?.subcategories || [];
  const isLoading = isSubmitting;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>सेवा प्रकार</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="तुमच्या सेवेचा प्रकार निवडा" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {serviceSubcategories.map(subcat => (
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
          
           <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="taluka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adFormDictionary.taluka.label}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={adFormDictionary.taluka.placeholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {talukaList.map((taluka) => (
                              <SelectItem key={taluka} value={taluka}>{taluka}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !selectedTaluka}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={adFormDictionary.location.placeholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {villageList.map((village, index) => (
                              <SelectItem key={`${village}-${index}`} value={village}>{village}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

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

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>तुमच्या सेवेबद्दल अधिक माहिती</FormLabel>
                <FormControl>
                  <Textarea placeholder="तुम्ही कोणत्या सेवा देता आणि तुमचा अनुभव याबद्दल लिहा..." {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>फोटो <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                {photoPreviews.length > 0 ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <Image src={photoPreviews[0]} alt="Preview" fill className="object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={removePhoto}
                      disabled={isLoading}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                      isLoading ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:border-primary hover:bg-secondary"
                    )}
                    onClick={() => !isLoading && fileInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">फोटो अपलोड करा</p>
                    <p className="mt-1 text-xs text-muted-foreground">तुमचे व्हिजिटिंग कार्ड किंवा कामाचा फोटो</p>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            व्यवसाय नोंदवा
        </Button>
      </form>
    </Form>
  );
}
