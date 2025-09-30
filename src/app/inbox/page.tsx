'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Conversation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mr, hi, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

const locales: { [key: string]: Locale } = { mr, hi, en: enUS };

export default function InboxPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary, language } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({
                variant: 'destructive',
                title: dictionary.inbox.accessDeniedTitle,
                description: dictionary.inbox.accessDeniedDescription,
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
                 toast({ variant: 'destructive', title: dictionary.inbox.errorTitle, description: dictionary.inbox.errorIndex });
            } else {
                 toast({ variant: 'destructive', title: dictionary.inbox.errorTitle, description: dictionary.inbox.errorFetch });
            }
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast, dictionary]);

    if (authLoading || pageLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const getOtherParticipant = (convo: Conversation) => {
        const otherId = convo.participants.find(p => p !== user?.uid);
        return otherId ? convo.participantProfiles[otherId] : null;
    }

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: locales[language] });
    };

    return (
        <main className="flex-1">
            <div className="border-b p-4">
                <h1 className="text-2xl font-bold">{dictionary.inbox.title}</h1>
                <p className="text-muted-foreground">{dictionary.inbox.description}</p>
            </div>
            
            {conversations.length > 0 ? (
                <div className="divide-y">
                    {conversations.map(convo => {
                        const otherParticipant = getOtherParticipant(convo);
                        const isUnread = user && convo.unreadBy && convo.unreadBy[user.uid];
                        const lastMessagePrefix = user && convo.lastMessageSenderId === user.uid ? `${dictionary.inbox.you}: ` : "";

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
                                        <p className="text-sm text-muted-foreground">{dictionary.inbox.with}: {otherParticipant?.name || dictionary.inbox.unknownUser}</p>
                                        <p className={`text-sm truncate ${isUnread ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                            {lastMessagePrefix}{convo.lastMessage || dictionary.inbox.noMessages}
                                        </p>
                                    </div>
                                    {isUnread && <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0 mt-1"></div>}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center text-center p-4">
                    <MessageSquarePlus className="h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-lg font-semibold text-muted-foreground">
                        {dictionary.inbox.emptyTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {dictionary.inbox.emptyDescription}
                    </p>
                    <Button className="mt-6" onClick={() => router.push('/')}>
                        {dictionary.inbox.browseAdsButton}
                    </Button>
                </div>
            )}
        </main>
    );
}
    