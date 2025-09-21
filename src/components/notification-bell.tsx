
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { mr } from 'date-fns/locale';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(notifs);
            const unread = notifs.filter(n => !n.read).length;
            setUnreadCount(unread);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAsRead = async (notificationId: string) => {
        const notifDoc = doc(db, 'notifications', notificationId);
        await updateDoc(notifDoc, { read: true });
    };
    
    const handleMarkAllAsRead = async () => {
        notifications.forEach(async (notif) => {
            if (!notif.read) {
                await handleMarkAsRead(notif.id);
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">सूचना</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>सूचना</span>
                     {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto px-2 py-1 text-xs">
                            <CheckCheck className="mr-1 h-3 w-3" />
                            सर्व वाचल्या म्हणून चिन्हांकित करा
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} onSelect={(e) => e.preventDefault()} className={`flex flex-col items-start gap-1 whitespace-normal ${!notif.read ? 'bg-secondary' : ''}`} onClick={() => handleMarkAsRead(notif.id)}>
                            <div className="flex w-full justify-between items-start">
                                <p className={`text-sm font-semibold ${notif.type === 'ad-approved' ? 'text-primary' : 'text-destructive'}`}>
                                    {notif.type === 'ad-approved' ? 'जाहिरात मंजूर' : 'जाहिरात नाकारली'}
                                </p>
                                {!notif.read && <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>}
                            </div>
                            <p className="text-xs text-muted-foreground w-full">{notif.message}</p>
                            <p className="text-xs text-muted-foreground/80 self-end">
                               {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: mr }) : ''}
                            </p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-muted-foreground">कोणत्याही सूचना नाहीत.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
