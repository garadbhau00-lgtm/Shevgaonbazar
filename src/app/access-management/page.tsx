
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import AppHeader from '@/components/layout/app-header';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AccessManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'तुमच्याकडे ही संसाधने पाहण्याची परवानगी नाही.' });
                router.push('/more');
                return;
            }

            const fetchUsers = async () => {
                try {
                    const usersCollection = collection(db, 'users');
                    const userSnapshot = await getDocs(usersCollection);
                    const userList = userSnapshot.docs.map(doc => doc.data() as UserProfile);
                    setUsers(userList);
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast({ variant: 'destructive', title: 'त्रुटी', description: 'वापरकर्त्यांना आणण्यात अयशस्वी.' });
                } finally {
                    setPageLoading(false);
                }
            };

            fetchUsers();
        }
    }, [authLoading, userProfile, router, toast]);


    const handleToggle = async (uid: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        try {
            const userDoc = doc(db, 'users', uid);
            await updateDoc(userDoc, { disabled: newStatus });
            setUsers(users.map(u => u.uid === uid ? { ...u, disabled: newStatus } : u));
            toast({ title: 'यशस्वी', description: `वापरकर्ता यशस्वीरित्या ${newStatus ? 'अक्षम' : 'सक्षम'} झाला आहे.` });
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'वापरकर्त्याची स्थिती अद्यतनित करण्यात अयशस्वी.' });
        }
    };
    
    if (authLoading || pageLoading) {
        return (
            <div>
                <AppHeader showUserOptions={false} />
                <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="p-4">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">प्रवेश व्यवस्थापन</h1>
                    <p className="text-muted-foreground">वापरकर्ता खाती सक्षम किंवा अक्षम करा.</p>
                </div>
                <div className="space-y-4">
                    {users.map((user) => (
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
                                    onCheckedChange={() => handleToggle(user.uid, !user.disabled)}
                                    disabled={userProfile?.uid === user.uid} // Admin can't disable themselves
                                    aria-label={`Toggle user ${user.email}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
