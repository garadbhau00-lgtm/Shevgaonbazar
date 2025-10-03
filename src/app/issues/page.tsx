
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import type { Issue } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, User, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function IssuesPage() {
    const { userProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { dictionary } = useLanguage();
    const issuesDict = dictionary.issues;

    const [issues, setIssues] = useState<Issue[]>([]);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const checkAdminAndFetch = () => {
            if (userProfile?.role !== 'Admin') {
                toast({ variant: 'destructive', title: issuesDict.accessDeniedTitle, description: issuesDict.accessDeniedDescription });
                router.push('/more');
                return;
            }

            const q = query(
                collection(db, "issues"),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const issuesList = querySnapshot.docs
                  .map(doc => ({ id: doc.id, ...doc.data() } as Issue));
                setIssues(issuesList);
                setPageLoading(false);
            }, (error) => {
                console.error("Error fetching issues:", error);
                toast({ variant: 'destructive', title: issuesDict.errorTitle, description: issuesDict.errorFetch });
                setPageLoading(false);
            });

            return unsubscribe;
        };

        if (!authLoading) {
            const unsubscribe = checkAdminAndFetch();
            return () => unsubscribe && unsubscribe();
        }
    }, [authLoading, userProfile, router, toast, issuesDict]);
    
    const handleUpdateStatus = async (issue: Issue, status: Issue['status']) => {
        try {
            const issueDoc = doc(db, 'issues', issue.id);
            await updateDoc(issueDoc, { status });

            if (issue.userId) {
                const statusMessage = issuesDict.status[status] || status;
                 await addDoc(collection(db, 'notifications'), {
                    userId: issue.userId,
                    title: 'तुमच्या समस्येची स्थिती अद्यतनित झाली आहे',
                    message: `तुमच्या समस्येची स्थिती आता "${statusMessage}" आहे.`,
                    link: `/help-center`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                    type: 'ad_status',
                });
            }

            toast({ title: issuesDict.toast.successTitle, description: issuesDict.toast.updateSuccess });
        } catch (error) {
            console.error("Error updating issue status:", error);
            toast({ variant: 'destructive', title: issuesDict.errorTitle, description: issuesDict.toast.updateError });
        }
    };


    if (authLoading || pageLoading) {
        return (
            <div className="flex flex-col">
                <header className="sticky top-0 z-10">
                    <div className="relative h-28 w-full"></div>
                </header>
                <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <header className="sticky top-0 z-10">
                <div className="relative h-28 w-full">
                    <Image
                      src="https://picsum.photos/seed/issues-page/1200/400"
                      alt="Issues background"
                      fill
                      className="object-cover"
                      data-ai-hint="problem solving tools"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                        <h1 className="text-lg font-bold">{issuesDict.title}</h1>
                        <p className="mt-2 text-xs max-w-xl">{issuesDict.description}</p>
                    </div>
                </div>
            </header>
            <main className="p-4">
                <div className="space-y-4">
                    {issues.length > 0 ? issues.map((issue) => (
                         <Card key={issue.id} className="overflow-hidden">
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> {issue.name}</CardTitle>
                                        <a href={`mailto:${issue.email}`} className="text-sm text-muted-foreground flex items-center gap-2 hover:underline"><Mail className="h-4 w-4" />{issue.email}</a>
                                    </div>
                                    <Badge variant={getStatusVariant(issue.status)}>{issuesDict.status[issue.status]}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
                                 <p className="text-xs text-muted-foreground mt-4 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {format(issue.createdAt.toDate(), 'dd MMM yyyy, hh:mm a', { locale: enUS })}
                                </p>
                            </CardContent>
                            <CardFooter className="bg-muted/50 p-3 flex justify-end">
                                <Select value={issue.status} onValueChange={(value) => handleUpdateStatus(issue, value as Issue['status'])}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder={issuesDict.changeStatus} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new"><Clock className="h-4 w-4 mr-2 inline-block"/>{issuesDict.status.new}</SelectItem>
                                        <SelectItem value="in-progress"><Loader2 className="h-4 w-4 mr-2 inline-block animate-spin"/>{issuesDict.status['in-progress']}</SelectItem>
                                        <SelectItem value="resolved"><CheckCircle className="h-4 w-4 mr-2 inline-block"/>{issuesDict.status.resolved}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardFooter>
                         </Card>
                    )) : (
                        <div className="text-center text-muted-foreground mt-8 rounded-lg border-2 border-dashed py-12">
                            <p className="text-lg font-semibold">{issuesDict.noIssuesTitle}</p>
                            <p className="text-sm">{issuesDict.noIssuesDescription}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

    