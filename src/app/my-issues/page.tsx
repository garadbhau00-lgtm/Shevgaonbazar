
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import type { Issue } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, User, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const getStatusVariant = (status: Issue['status']): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
        case 'resolved':
            return 'default';
        case 'new':
            return 'secondary';
        case 'in-progress':
            return 'destructive'; // Using destructive for high visibility
    }
};

export default function MyIssuesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();
    const myIssuesDict = dictionary.myIssues;

    const [issues, setIssues] = useState<Issue[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            toast({
                variant: 'destructive',
                title: myIssuesDict.accessDeniedTitle,
                description: myIssuesDict.accessDeniedDescription,
            });
            router.push('/login');
            return;
        }

        const q = query(
            collection(db, "issues"),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const issuesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
            setIssues(issuesList);
            setPageLoading(false);
        }, (error) => {
            console.error("Error fetching user issues:", error);
            toast({ variant: 'destructive', title: myIssuesDict.errorTitle, description: myIssuesDict.errorFetch });
            setPageLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading, router, toast, myIssuesDict]);

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

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-10">
                <div className="relative h-28 w-full">
                    <Image
                      src="https://picsum.photos/seed/my-issues/1200/400"
                      alt="My Issues background"
                      fill
                      className="object-cover"
                      data-ai-hint="file cabinet documents"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                        <h1 className="text-lg font-bold">{myIssuesDict.title}</h1>
                        <p className="mt-2 text-xs max-w-xl">{myIssuesDict.description}</p>
                    </div>
                </div>
            </header>
            <main className="p-4">
                <div className="space-y-4">
                    {issues.length > 0 ? issues.map((issue) => (
                         <Card key={issue.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Badge variant={getStatusVariant(issue.status)}>{myIssuesDict.status[issue.status]}</Badge>
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {format(issue.createdAt.toDate(), 'dd MMM yyyy, hh:mm a', { locale: enUS })}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{issue.description}</p>
                            </CardContent>
                         </Card>
                    )) : (
                        <div className="text-center text-muted-foreground mt-8 rounded-lg border-2 border-dashed py-12">
                            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <p className="text-lg font-semibold mt-4">{myIssuesDict.noIssuesTitle}</p>
                            <p className="text-sm mt-2">{myIssuesDict.noIssuesDescription}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
