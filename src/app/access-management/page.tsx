'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

export default function AccessManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const usersList = querySnapshot.docs.map(doc => doc.data() as UserProfile);
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({ variant: 'destructive', title: dictionary.accessManagement.errorTitle, description: dictionary.accessManagement.errorFetchUsers });
            } finally {
                setPageLoading(false);
            }
        };

        if (!authLoading) {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: dictionary.accessManagement.accessDeniedTitle, description: dictionary.accessManagement.accessDeniedDescription });
                router.push('/more');
                return;
            }
            fetchUsers();
        }
    }, [authLoading, userProfile, router, toast, dictionary]);


    const handleUserToggle = async (uid: string, currentStatus: boolean) => {
        try {
            const userDoc = doc(db, 'users', uid);
            await updateDoc(userDoc, { disabled: currentStatus });
            setUsers(users.map(u => u.uid === uid ? { ...u, disabled: currentStatus } : u));
            toast({ title: dictionary.accessManagement.successTitle, description: `User successfully ${!currentStatus ? 'disabled' : 'enabled'}.` });
        } catch (error) {
            console.error("Error updating user status:", error);
            toast({ variant: 'destructive', title: dictionary.accessManagement.errorTitle, description: dictionary.accessManagement.errorUpdateStatus });
        }
    };
    
    if (authLoading || pageLoading) {
        return (
            <>
                <div className="relative h-28 w-full">
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
                <Image
                    src="https://picsum.photos/seed/access-management/1200/400"
                    alt="Access Management background"
                    fill
                    className="object-cover"
                    data-ai-hint="farm security"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{dictionary.accessManagement.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{dictionary.accessManagement.description}</p>
                </div>
            </div>
            <main className="p-4">
                <h2 className="text-lg font-bold mb-2">{dictionary.accessManagement.users}</h2>
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
                                    {user.disabled ? dictionary.accessManagement.disabled : dictionary.accessManagement.enabled}
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
                            {dictionary.accessManagement.noUsersFound}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
    