
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
    const [isPaymentToggleLoading, setIsPaymentToggleLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const usersList = querySnapshot.docs.map(doc => doc.data() as UserProfile);
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: 'त्रुटी', description: 'वापरकर्त्यांची सूची आणण्यात अयशस्वी. कृपया तुमच्या फायरस्टोअर नियमांची तपासणी करा.' });
            } finally {
                setPageLoading(false);
            }
        };

        if (!authLoading) {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'तुमच्याकडे ही संसाधने पाहण्याची परवानगी नाही.' });
                router.push('/more');
                return;
            }
            fetchUsers();
            
            const settingsDocRef = doc(db, 'config', 'settings');
            const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setIsPaymentEnabled(docSnap.data().isPaymentEnabled);
                }
                setIsPaymentToggleLoading(false);
            }, (error) => {
                console.error("Error fetching payment settings:", error);
                setIsPaymentToggleLoading(false);
            });
            
            return () => unsubscribe();
        }
    }, [authLoading, userProfile, router, toast]);


    const handleUserToggle = async (uid: string, currentStatus: boolean) => {
        try {
            const userDoc = doc(db, 'users', uid);
            await updateDoc(userDoc, { disabled: currentStatus });
            setUsers(users.map(u => u.uid === uid ? { ...u, disabled: currentStatus } : u));
            toast({ title: 'यशस्वी', description: `वापरकर्ता यशस्वीरित्या ${!currentStatus ? 'अक्षम' : 'सक्षम'} झाला आहे.` });
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'वापरकर्त्याची स्थिती अद्यतनित करण्यात अयशस्वी.' });
        }
    };
    
    const handlePaymentToggle = async (enabled: boolean) => {
        setIsPaymentToggleLoading(true);
        try {
            const settingsDocRef = doc(db, 'config', 'settings');
            await updateDoc(settingsDocRef, { isPaymentEnabled: enabled });
            setIsPaymentEnabled(enabled); // Optimistic update
             toast({ title: 'यशस्वी', description: `जाहिरात पेमेंट यशस्वीरित्या ${enabled ? 'सक्षम' : 'अक्षम'} केले आहे.` });
        } catch (error) {
            console.error("Error updating payment settings:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'पेमेंट सेटिंग्ज अद्यतनित करण्यात अयशस्वी.' });
        } finally {
            setIsPaymentToggleLoading(false);
        }
    }
    
    if (authLoading || pageLoading) {
        return (
            <>
                <div className="relative h-28 w-full">
                    <AppHeader />
                </div>
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative h-28 w-full">
                <AppHeader />
                <Image
                    src="https://picsum.photos/seed/access-management/1200/400"
                    alt="Access Management background"
                    fill
                    className="object-cover"
                    data-ai-hint="farm security"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">प्रवेश व्यवस्थापन</h1>
                    <p className="mt-2 text-xs max-w-xl">वापरकर्ता खाती आणि पेमेंट सेटिंग्ज सक्षम किंवा अक्षम करा.</p>
                </div>
            </div>
            <main className="p-4">
                 <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-base">Global Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">जाहिरात पेमेंट</p>
                                <p className="text-sm text-muted-foreground">जाहिरात पोस्ट करण्यासाठी १० रुपये पेमेंट आवश्यक आहे का.</p>
                            </div>
                            {isPaymentToggleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                 <Switch
                                    checked={isPaymentEnabled}
                                    onCheckedChange={handlePaymentToggle}
                                    aria-label="Toggle Ad Payment"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <h2 className="text-lg font-bold mb-2">वापरकर्ते</h2>
                <div className="space-y-4">
                    {users.length > 0 ? users.map((user) => (
                        <div key={user.uid} className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100`} />
                                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.name || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${user.disabled ? 'text-destructive' : 'text-primary'}`}>
                                    {user.disabled ? 'अक्षम' : 'सक्षम'}
                                </span>
                                <Switch
                                    checked={!user.disabled}
                                    onCheckedChange={(checked) => handleUserToggle(user.uid, !checked)}
                                    disabled={userProfile?.uid === user.uid} // Admin can't disable themselves
                                    aria-label={`Toggle user ${user.email}`}
                                />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-muted-foreground mt-8">
                            कोणतेही वापरकर्ते आढळले नाहीत.
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
