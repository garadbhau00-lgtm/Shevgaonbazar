
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { AppNotification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellOff, BellRing, Info, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';


export default function NotificationsPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const notificationDict = dictionary.notifications;

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }
        
        const q = user.uid ? query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null;

        if (!q) {
            setPageLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            setNotifications(notifs);
            setPageLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            toast({ variant: 'destructive', title: notificationDict.errorTitle, description: notificationDict.errorFetch });
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast, notificationDict]);

    const handleNotificationClick = async (notification: AppNotification) => {
        if (userProfile?.role === 'Admin') {
             if (!notification.isRead) {
                const notifDoc = doc(db, 'notifications', notification.id);
                updateDoc(notifDoc, { isRead: true }).catch((serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: notifDoc.path,
                        operation: 'update',
                        requestResourceData: { isRead: true }
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
             }
        } else {
            // Regular users delete the notification on click
            const notifDocRef = doc(db, 'notifications', notification.id);
            deleteDoc(notifDocRef).catch((serverError) => {
                 const permissionError = new FirestorePermissionError({
                    path: notifDocRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
    };
    
    const handleMarkAllAsRead = async () => {
        if (!user) return;
        
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            if (!notif.isRead && notif.userId === user.uid) {
                 const notifRef = doc(db, 'notifications', notif.id);
                 batch.update(notifRef, { isRead: true });
            }
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }
    
    const handleDeleteNotification = async () => {
        if (!notificationToDelete) return;
        setIsDeleting(true);
        const notifDocRef = doc(db, 'notifications', notificationToDelete.id);

        deleteDoc(notifDocRef)
            .then(() => {
                toast({ title: "Success", description: "Notification deleted successfully." });
                setNotificationToDelete(null);
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: notifDocRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };


    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: enUS });
        } catch (e) {
            return formatDistanceToNow(timestamp, { addSuffix: true, locale: enUS });
        }
    };

    if (authLoading || pageLoading) {
        return (
            <>
                <div className="relative h-28 w-full"></div>
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </>
        );
    }
    
    const hasUnread = notifications.some(n => !n.isRead && n.userId === user?.uid);

    return (
        <div>
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/notifications/1200/400"
                    alt="Notifications background"
                    fill
                    className="object-cover"
                    data-ai-hint="bell ringing"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-base font-bold">{notificationDict.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{notificationDict.description}</p>
                </div>
            </div>
            <main className="p-4">
                 {notifications.length > 0 && hasUnread && userProfile?.role !== 'Admin' && (
                    <div className="mb-4 flex justify-end">
                        <Button variant="link" className="p-0 h-auto text-sm" onClick={handleMarkAllAsRead}>
                            {dictionary.notifications.markAllAsRead || 'Mark all as read'}
                        </Button>
                    </div>
                )}
                <div className="space-y-3">
                    {notifications.length > 0 ? (
                        notifications.map(notif => {
                            const isOwnNotification = notif.userId === user?.uid;
                            const Wrapper = notif.link && isOwnNotification ? Link : 'div';
                            const props = notif.link && isOwnNotification ? { href: notif.link } : {};
                            
                            return (
                                <Wrapper key={notif.id} {...props}>
                                    <div 
                                        className={cn(
                                            "block rounded-lg p-4 shadow-sm transition-colors",
                                            isOwnNotification && "hover:bg-secondary",
                                            isOwnNotification && !notif.isRead ? 'bg-secondary' : 'bg-card'
                                        )}
                                        onClick={() => isOwnNotification && handleNotificationClick(notif)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                                                notif.type === 'ad_status' ? 'bg-blue-100' : 'bg-green-100'
                                            )}>
                                                {notif.type === 'ad_status' ? (
                                                    <Info className="h-5 w-5 text-blue-600" />
                                                ) : (
                                                    <BellRing className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{notif.title}</h3>
                                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(notif.createdAt)}</p>
                                                {userProfile?.role === 'Admin' && <p className="text-xs text-muted-foreground">To: {notif.userId === user?.uid ? 'You' : notif.userId.slice(0,6)}...</p>}
                                            </div>
                                            {isOwnNotification && !notif.isRead && (
                                                <div className="h-2.5 w-2.5 flex-shrink-0 mt-1.5 rounded-full bg-primary"></div>
                                            )}
                                             {userProfile?.role === 'Admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setNotificationToDelete(notif);
													}}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Wrapper>
                            );
                        })
                    ) : (
                        <div className="flex h-[calc(100vh-20rem)] flex-col items-center justify-center text-center p-4 rounded-lg border-2 border-dashed">
                             <BellOff className="h-16 w-16 text-muted-foreground/50" />
                             <p className="mt-4 text-lg font-semibold text-muted-foreground">
                                 {notificationDict.noNotificationsTitle}
                             </p>
                             <p className="mt-1 text-sm text-muted-foreground">
                                 {notificationDict.noNotificationsDescription}
                            </p>
                        </div>
                    )}
                </div>
            </main>

             <AlertDialog open={!!notificationToDelete} onOpenChange={(open) => !open && setNotificationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this notification?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action cannot be undone. This will permanently delete this notification for all users it was sent to.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteNotification}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Notification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
