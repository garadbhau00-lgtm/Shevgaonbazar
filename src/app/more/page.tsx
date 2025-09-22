
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, HelpCircle, LogIn, LogOut, Settings, User, UserPlus, ShieldCheck, ListChecks, Database } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AppHeader from '@/components/layout/app-header';
import Image from 'next/image';


const baseMenuItems = [
    { label: "सेटिंग्ज", icon: Settings, href: "/settings" },
    { label: "मदत केंद्र", icon: HelpCircle, href: "/help-center" },
];

const adminMenuItems = [
    { label: "प्रवेश व्यवस्थापन", icon: ShieldCheck, href: "/access-management" },
    { label: "जाहिरात व्यवस्थापन", icon: ListChecks, href: "/ad-management" },
    { label: "QR व्यवस्थापन", icon: Database, href: "/qr-management" },
];

export default function MorePage() {
    const { user, userProfile, loading, handleLogout } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const onLogout = async () => {
        await handleLogout();
        router.push('/login');
    }

    const getMenuItems = () => {
        const menu = [...baseMenuItems];
        if (userProfile?.role === 'Admin') {
            menu.push(...adminMenuItems);
        }
        return menu;
    };

    const renderUserProfile = () => {
        if (!isClient || loading) {
             return (
                <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm mb-6">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            )
        }

        if (user && userProfile) {
            return (
                <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm mb-6">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user.photoURL || undefined} alt="User" />
                        <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-xl font-bold">{userProfile.name || 'वापरकर्ता'}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            );
        }

        return (
             <div className="rounded-lg bg-card p-6 text-center shadow-sm mb-6">
                <h2 className="text-xl font-bold">शेवगाव बाजारमध्ये सामील व्हा</h2>
                <p className="mt-2 text-muted-foreground">तुमच्या स्थानिक शेतकरी समुदायाशी कनेक्ट व्हा.</p>
                <div className="mt-4 flex gap-2">
                    <Button asChild className="flex-1">
                        <Link href="/login">लॉगिन करा</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                        <Link href="/signup">साइन अप करा</Link>
                    </Button>
                </div>
            </div>
        );
    }


    return (
        <div>
            <div className="relative h-28 w-full">
                <AppHeader />
                <Image
                    src="https://picsum.photos/seed/more-page/1200/400"
                    alt="More page background"
                    fill
                    className="object-cover"
                    data-ai-hint="farm settings"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-lg font-bold">अधिक पर्याय</h1>
                    <p className="mt-2 text-xs max-w-xl">तुमचे खाते, सेटिंग्ज आणि बरेच काही व्यवस्थापित करा.</p>
                </div>
            </div>
            <main className="p-4">
                {renderUserProfile()}

                <div className="space-y-2">
                    {getMenuItems().map((item) => (
                        <Link
                            href={item.href}
                            key={item.label}
                            className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="h-5 w-5 text-primary" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    ))}
                    {user && (
                        <div
                            className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary cursor-pointer"
                            onClick={onLogout}
                        >
                            <div className="flex items-center gap-4">
                                <LogOut className="h-5 w-5 text-destructive" />
                                <span className="font-medium text-destructive">लॉगआउट</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
