
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Conversation } from '@/lib/types';
import AppHeader from '@/components/layout/app-header';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mr } from 'date-fns/locale/mr';

export default function InboxPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'प्रवेश प्रतिबंधित',
                description: 'तुमचा इनबॉक्स पाहण्यासाठी कृपया लॉगिन करा.',
            });
            router.push('/login');
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
            setConversations(convos);
            setPageLoading(false);
        }, (error) => {
            console.error("Error fetching conversations:", error);
            if (error.message.includes("requires an index")) {
                 toast({ variant: 'destructive', title: 'त्रुटी', description: 'तुमचे चॅट्स आणण्यात अयशस्वी. कृपया फायरस्टोअर इंडेक्स तपासा.' });
            } else {
                 toast({ variant: 'destructive', title: 'त्रुटी', description: 'तुमचे चॅट्स आणण्यात अयशस्वी.' });
            }
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast]);

    if (authLoading || pageLoading) {
        return (
            <div>
                <AppHeader showUserOptions={false} />
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    const getOtherParticipant = (convo: Conversation) => {
        const otherId = convo.participants.find(p => p !== user?.uid);
        return otherId ? convo.participantProfiles[otherId] : null;
    }

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: mr });
    };

    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="flex-1">
                <div className="border-b p-4">
                    <h1 className="text-2xl font-bold">इनबॉक्स</h1>
                    <p className="text-muted-foreground">तुमचे संभाषण येथे पहा.</p>
                </div>
                
                {conversations.length > 0 ? (
                    <div className="divide-y">
                        {conversations.map(convo => {
                            const otherParticipant = getOtherParticipant(convo);
                            const isUnread = user && convo.unreadBy && convo.unreadBy[user.uid];
                            const lastMessagePrefix = user && convo.lastMessageSenderId === user.uid ? "तुम्ही: " : "";

                            return (
                                <Link href={`/inbox/${convo.id}`} key={convo.id}>
                                    <div className={`p-4 flex items-start gap-4 transition-colors hover:bg-secondary ${isUnread ? 'bg-secondary' : 'bg-card'}`}>
                                        <div className="relative h-16 w-16 flex-shrink-0">
                                            <Image src={convo.adPhoto} alt={convo.adTitle} fill className="rounded-md object-cover" />
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold truncate">{convo.adTitle}</h3>
                                                {convo.lastMessageTimestamp && (
                                                    <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                                        {formatTimestamp(convo.lastMessageTimestamp)}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">सोबत: {otherParticipant?.name || 'अज्ञात'}</p>
                                            <p className={`text-sm truncate ${isUnread ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                                {lastMessagePrefix}{convo.lastMessage || 'अद्याप कोणतेही संदेश नाहीत.'}
                                            </p>
                                        </div>
                                         {isUnread && <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0 mt-1"></div>}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center text-center p-4">
                        <MessageSquarePlus className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-semibold text-muted-foreground">
                            तुमचा इनबॉक्स रिकामा आहे.
                        </p>
                         <p className="mt-1 text-sm text-muted-foreground">
                            एखाद्या जाहिरातीवर 'चॅट करा' बटण दाबून संभाषण सुरू करा.
                        </p>
                        <Button className="mt-6" onClick={() => router.push('/')}>
                            जाहिराती ब्राउझ करा
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
