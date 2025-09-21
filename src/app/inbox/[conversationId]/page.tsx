
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

export default function ChatPage() {
    const { conversationId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

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

        // Fetch conversation details
        const unsubscribeConvo = onSnapshot(conversationRef, async (docSnap) => {
            if (docSnap.exists()) {
                const convoData = { id: docSnap.id, ...docSnap.data() } as Conversation;
                
                if (!convoData.participants.includes(user.uid)) {
                    toast({ variant: 'destructive', title: 'प्रवेश प्रतिबंधित', description: 'तुम्ही या संभाषणाचा भाग नाही.' });
                    router.push('/inbox');
                    return;
                }
                
                setConversation(convoData);
                
                // Mark messages as read
                if (convoData.unreadBy && convoData.unreadBy[user.uid]) {
                    await updateDoc(conversationRef, {
                        [`unreadBy.${user.uid}`]: false
                    });
                }
            } else {
                toast({ variant: 'destructive', title: 'संभाषण आढळले नाही', description: 'हे संभाषण अस्तित्वात नाही.' });
                router.push('/inbox');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching conversation:", error);
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'संभाषण लोड करण्यात अयशस्वी.' });
            router.push('/inbox');
        });

        // Fetch messages
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

    }, [conversationId, user, authLoading, router, toast]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !conversation) return;

        setIsSending(true);
        try {
            const messageText = newMessage.trim();
            setNewMessage('');
            
            // Add message to subcollection
            const messagesRef = collection(db, 'conversations', conversationId as string, 'messages');
            await addDoc(messagesRef, {
                text: messageText,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            });

            // Update last message on conversation
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
            setNewMessage(newMessage); // Re-set the message on error
            toast({ variant: 'destructive', title: 'त्रुटी', description: 'संदेश पाठवण्यात अयशस्वी.' });
        } finally {
            setIsSending(false);
        }
    };
    
    if (loading || authLoading) {
        return (
            <div className="flex h-screen flex-col">
                 <header className="flex h-16 items-center gap-4 border-b bg-card px-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/inbox')}>
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
        return null; // or a 'not found' component
    }

    const otherParticipantId = conversation.participants.find(p => p !== user?.uid);
    const otherParticipantProfile = otherParticipantId ? conversation.participantProfiles[otherParticipantId] : null;

    return (
        <div className="flex h-screen flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/inbox')}>
                    <ArrowLeft />
                </Button>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={otherParticipantProfile?.photoURL} />
                    <AvatarFallback>{otherParticipantProfile?.name.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <h2 className="font-semibold truncate">{otherParticipantProfile?.name || 'अज्ञात'}</h2>
                    <Link href={`/ad/${conversation.adId}`} className="text-xs text-muted-foreground hover:underline truncate">
                        {conversation.adTitle}
                    </Link>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-end gap-2 ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                         {message.senderId !== user?.uid && (
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={otherParticipantProfile?.photoURL} />
                                <AvatarFallback>{otherParticipantProfile?.name.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                         )}
                        <p className={`max-w-[70%] rounded-lg px-4 py-2 ${message.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                            {message.text}
                        </p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="sticky bottom-0 border-t bg-card p-2">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <Input 
                        placeholder="मेसेज टाइप करा..." 
                        className="pr-12" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" disabled={isSending || !newMessage.trim()}>
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </footer>
        </div>
    )
}
