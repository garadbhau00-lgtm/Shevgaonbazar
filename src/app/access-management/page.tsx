
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where,getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Users, Wifi, WifiOff, ListChecks } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { hi, enUS } from 'date-fns/locale';

const locales: { [key: string]: Locale } = { hi, en: enUS };

const UserStatus = ({ user, dictionary, language }: { user: UserProfile, dictionary: any, language: string }) => {
    const isOnline = user.lastSeen && (new Date().getTime() - user.lastSeen.toDate().getTime()) < 5 * 60 * 1000;
    const locale = locales[language] || enUS;
    
    if (user.disabled) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                <span className="text-sm font-medium text-destructive">
                    {dictionary.accessManagement.disabled}
                </span>
            </div>
        );
    }
    
    if (isOnline) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse" />
                <span className="text-sm font-medium text-green-600">
                    Online
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" />
            <span className="text-sm font-medium text-muted-foreground">
                {user.lastSeen ? `Active ${formatDistanceToNow(user.lastSeen.toDate(), { addSuffix: true, locale })}` : 'Never active'}
            </span>
        </div>
    );
};


export default function AccessManagementPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary, language } = useLanguage();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const usersList = querySnapshot.docs.map(doc => ({ ...doc.data() as UserProfile, adCount: -1 }));
                
                setUsers(usersList.sort((a, b) => (b.lastSeen?.toMillis() || 0) - (a.lastSeen?.toMillis() || 0)));

                usersList.forEach(async (user, index) => {
                    const adsQuery = query(collection(db, 'ads'), where('userId', '==', user.uid));
                    const snapshot = await getCountFromServer(adsQuery);
                    const count = snapshot.data().count;

                    setUsers(currentUsers => {
                        const newUsers = [...currentUsers];
                        const userIndex = newUsers.findIndex(u => u.uid === user.uid);
                        if(userIndex !== -1) {
                           newUsers[userIndex] = { ...newUsers[userIndex], adCount: count };
                        }
                        return newUsers;
                    });
                });

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


    const handleUserToggle = async (uid: string, checked: boolean) => {
        const isDisabled = !checked;
        try {
            const userDoc = doc(db, 'users', uid);
            await updateDoc(userDoc, { disabled: isDisabled });

            setUsers(currentUsers =>
                currentUsers.map(u => (u.uid === uid ? { ...u, disabled: isDisabled } : u))
            );

            toast({ title: dictionary.accessManagement.successTitle, description: `User successfully ${!isDisabled ? 'enabled' : 'disabled'}.` });
        } catch (error) {
            console.error("Error updating user status:", error);
            // Revert UI change on error
            setUsers(currentUsers =>
                currentUsers.map(u => (u.uid === uid ? { ...u, disabled: !isDisabled } : u))
            );
            toast({ variant: 'destructive', title: dictionary.accessManagement.errorTitle, description: dictionary.accessManagement.errorUpdateStatus });
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'users', userToDelete.uid));
            setUsers(users.filter(u => u.uid !== userToDelete.uid));
            toast({ title: dictionary.accessManagement.successTitle, description: "User successfully deleted." });
            setUserToDelete(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            toast({ variant: 'destructive', title: dictionary.accessManagement.errorTitle, description: "Failed to delete user." });
        } finally {
            setIsDeleting(false);
        }
    };

    const now = new Date().getTime();
    const onlineCount = users.filter(u => u.lastSeen && (now - u.lastSeen.toDate().getTime()) < 5 * 60 * 1000).length;
    const offlineCount = users.length - onlineCount;
    
    if (authLoading || pageLoading) {
        return (
            <>
                <div className="relative h-28 w-full">
                </div>
                <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
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
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">{dictionary.accessManagement.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{dictionary.accessManagement.description}</p>
                    <div className="mt-4 flex items-center justify-center gap-4 rounded-full bg-black/30 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                        <div className="flex items-center gap-1.5" title="Online Users">
                             <Wifi className="h-4 w-4 text-green-400"/>
                             <span>{onlineCount}</span>
                        </div>
                         <div className="flex items-center gap-1.5" title="Offline Users">
                             <WifiOff className="h-4 w-4 text-red-400"/>
                             <span>{offlineCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Total Users">
                            <Users className="h-4 w-4"/>
                            <span>{users.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            <main className="p-4">
                <h2 className="text-lg font-bold mb-2">{dictionary.accessManagement.users}</h2>
                <div className="space-y-4">
                    {users.length > 0 ? users.map((user) => (
                        <div key={user.uid} className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/${user.uid}/100`} />
                                    <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold truncate">{user.name || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    <UserStatus user={user} dictionary={dictionary} language={language} />
                                </div>
                            </div>
                             <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                {user.adCount !== undefined && user.adCount > -1 ? (
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{user.adCount}</p>
                                        <p className="text-xs text-muted-foreground">Ads</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setUserToDelete(user)}
                                    disabled={userProfile?.uid === user.uid}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Switch
                                    checked={!user.disabled}
                                    onCheckedChange={(checked) => handleUserToggle(user.uid, checked)}
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
            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>

                        <AlertDialogDescription>
                           This action cannot be undone. This will permanently delete the user's profile. It will not delete their authentication record or their ads.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
