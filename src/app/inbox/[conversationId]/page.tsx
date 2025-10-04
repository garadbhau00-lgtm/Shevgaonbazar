
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, addDoc, serverTimestamp, query, orderBy, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Conversation, ChatMessage } from '@/lib/types';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

export default function ChatPage() {
    const { conversationId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const { dictionary } = useLanguage();

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const conversationRef = doc(db, 'conversations', conversationId as string);

        const unsubscribeConvo = onSnapshot(conversationRef, async (docSnap) => {
            if (docSnap.exists()) {
                const convoData = { id: docSnap.id, ...docSnap.data() } as Conversation;
                
                if (!convoData.participants.includes(user.uid)) {
                    toast({ variant: 'destructive', title: dictionary.chat.accessDeniedTitle, description: dictionary.chat.accessDeniedDescription });
                    router.push('/inbox');
                    return;
                }
                
                setConversation(convoData);
                
                if (convoData.unreadBy && convoData.unreadBy[user.uid]) {
                    await updateDoc(conversationRef, {
                        [`unreadBy.${user.uid}`]: false
                    });
                }
            } else {
                toast({ variant: 'destructive', title: dictionary.chat.notFoundTitle, description: dictionary.chat.notFoundDescription });
                router.push('/inbox');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching conversation:", error);
            toast({ variant: 'destructive', title: dictionary.chat.errorTitle, description: dictionary.chat.errorLoad });
            router.push('/inbox');
        });

        const messagesRef = collection(db, 'conversations', conversationId as string, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            setMessages(msgs);
        });

        return () => {
            unsubscribeConvo();
            unsubscribeMessages();
        };

    }, [conversationId, user, authLoading, router, toast, dictionary]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !conversation) return;

        setIsSending(true);
        const messageText = newMessage.trim();
        try {
            setNewMessage('');
            
            const messagesRef = collection(db, 'conversations', conversationId as string, 'messages');
            await addDoc(messagesRef, {
                text: messageText,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            });

            const conversationRef = doc(db, 'conversations', conversationId as string);
            const otherParticipantId = conversation.participants.find(p => p !== user.uid);
            await updateDoc(conversationRef, {
                lastMessage: messageText,
                lastMessageSenderId: user.uid,
                lastMessageTimestamp: serverTimestamp(),
                [`unreadBy.${otherParticipantId}`]: true,
            });

        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(messageText); 
            toast({ variant: 'destructive', title: dictionary.chat.errorTitle, description: dictionary.chat.errorSend });
        } finally {
            setIsSending(false);
        }
    };
    
    if (loading || authLoading) {
        return (
            <div className="flex h-screen flex-col">
                 <header className="flex h-16 items-center gap-4 border-b bg-card px-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div className="h-8 w-32 rounded-md bg-muted animate-pulse"></div>
                </header>
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }
    
    if (!conversation) {
        return null; 
    }

    const otherParticipantId = conversation.participants.find(p => p !== user?.uid);
    const otherParticipantProfile = otherParticipantId ? conversation.participantProfiles[otherParticipantId] : null;

    return (
        <div className="fixed inset-0 z-20 flex max-w-lg mx-auto flex-col bg-background">
            <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b bg-card px-4 shadow-sm">
                 <Link href="/inbox" passHref>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={otherParticipantProfile?.photoURL} />
                    <AvatarFallback>{otherParticipantProfile?.name.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <h2 className="font-semibold truncate">{otherParticipantProfile?.name || dictionary.chat.unknownUser}</h2>
                    <Link href={`/ad/${conversation.adId}`} className="text-xs text-muted-foreground hover:underline truncate">
                        {conversation.adTitle}
                    </Link>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/20">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-end gap-2.5 ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                         {message.senderId !== user?.uid && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={otherParticipantProfile?.photoURL} />
                                <AvatarFallback>{otherParticipantProfile?.name.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                         )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${message.senderId === user?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card rounded-bl-none'}`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="border-t bg-background p-2 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <Input 
                        placeholder={dictionary.chat.messagePlaceholder}
                        className="pr-12 h-11 rounded-full" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </footer>
        </div>
    )
}
    
