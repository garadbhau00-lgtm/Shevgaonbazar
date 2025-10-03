
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { AppNotification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellOff, BellRing, Check, Info } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { formatDistanceToNow } from 'date-fns';
import { hi, enUS, mr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const locales: { [key: string]: Locale } = { hi, en: enUS, mr };

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary, language } = useLanguage();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    const notificationDict = dictionary.notifications;

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            setNotifications(notifs);
            setPageLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            toast({ variant: 'destructive', title: notificationDict.errorTitle, description: notificationDict.errorFetch });
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast, notificationDict]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const notifDoc = doc(db, 'notifications', notificationId);
            await updateDoc(notifDoc, { isRead: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        if (!user) return;
        
        const batch = writeBatch(db);
        notifications.forEach(notif => {
            if (!notif.isRead) {
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

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const locale = locales[language] || mr;
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale });
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
    
    const hasUnread = notifications.some(n => !n.isRead);

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
                    <h1 className="text-lg font-bold">{notificationDict.title}</h1>
                    <p className="mt-2 text-xs max-w-xl">{notificationDict.description}</p>
                </div>
            </div>
            <main className="p-4">
                 {notifications.length > 0 && hasUnread && (
                    <div className="mb-4 flex justify-end">
                        <Button variant="link" className="p-0 h-auto text-sm" onClick={handleMarkAllAsRead}>
                            {dictionary.notifications.markAsRead}
                        </Button>
                    </div>
                )}
                <div className="space-y-3">
                    {notifications.length > 0 ? (
                        notifications.map(notif => {
                            const Wrapper = notif.link ? Link : 'div';
                            const props = notif.link ? { href: notif.link } : {};
                            
                            return (
                                <Wrapper key={notif.id} {...props}>
                                    <div 
                                        className={cn(
                                            "block rounded-lg p-4 shadow-sm transition-colors hover:bg-secondary",
                                            notif.isRead ? 'bg-card' : 'bg-secondary'
                                        )}
                                        onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
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
                                                <h3 className="font-semibold">{notif.title}</h3>
                                                <p className="text-sm text-muted-foreground">{notif.message}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{formatTimestamp(notif.createdAt)}</p>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="h-2.5 w-2.5 flex-shrink-0 mt-1.5 rounded-full bg-primary"></div>
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
        </div>
    );
}
