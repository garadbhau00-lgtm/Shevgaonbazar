'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type HelpMessage = {
    id: string;
    userId: string;
    userEmail: string;
    message: string;
    createdAt: any;
};

export default function AdminMessagesPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [messages, setMessages] = useState<HelpMessage[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (userProfile?.role !== 'Admin') {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
            router.push('/more');
            return;
        }

        const q = query(collection(db, 'help_messages'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpMessage));
            setMessages(msgs);
            setPageLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch messages.' });
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [authLoading, userProfile, router, toast]);

    if (authLoading || pageLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="relative h-28 w-full">
                <Image
                    src="https://picsum.photos/seed/admin-messages/1200/400"
                    alt="Admin Messages background"
                    fill
                    className="object-cover"
                    data-ai-hint="desk paperwork"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">Admin Messages</h1>
                    <p className="mt-2 text-xs max-w-xl">Messages from users via the Help Center.</p>
                </div>
            </div>
            <main className="p-4">
                {messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <Card key={msg.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{msg.userEmail}</CardTitle>
                                    <CardDescription>
                                        {formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{msg.message}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground mt-8">
                        <p>No messages yet.</p>
                    </div>
                )}
            </main>
        </>
    );
}
