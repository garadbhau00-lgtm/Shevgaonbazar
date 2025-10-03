
'use client';

import { useAuth } from '@/hooks/use-auth';
import { ChevronRight, HelpCircle, LogOut, Settings, ShieldCheck, ListChecks, Megaphone, Languages, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import LanguageSwitcher from '@/components/language-switcher';
import { useLanguage } from '@/contexts/language-context';

export default function MorePage() {
    const { user, userProfile, loading, handleLogout } = useAuth();
    const router = useRouter();
    const { dictionary } = useLanguage();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const onLogout = async () => {
        await handleLogout();
        router.push('/login');
    }

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
                        <AvatarImage src={userProfile.photoURL || undefined} alt="User" />
                        <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-base font-bold">{userProfile.name || dictionary.more.user}</h2>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            );
        }

        return (
             <div className="rounded-lg bg-card p-2 text-center shadow-sm mb-6">
                <h2 className="text-base font-bold">{dictionary.more.joinShevgaonBazar}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{dictionary.more.connectWithCommunity}</p>
                <div className="mt-3 flex gap-2">
                    <Button asChild className="flex-1" size="sm">
                        <Link href="/login">{dictionary.login.loginButton}</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1" size="sm">
                        <Link href="/signup">{dictionary.signup.signupButton}</Link>
                    </Button>
                </div>
            </div>
        );
    }
    
    const baseMenuItems = [
        { label: dictionary.more.settings, icon: Settings, href: "/settings" },
        { label: dictionary.more.helpCenter, icon: HelpCircle, href: "/help-center" },
    ];

    const adminMenuItems = [
        { label: dictionary.more.accessManagement, icon: ShieldCheck, href: "/access-management" },
        { label: dictionary.more.adManagement, icon: ListChecks, href: "/ad-management" },
        { label: dictionary.more.broadcast, icon: Megaphone, href: "/broadcast" },
        { label: dictionary.more.issues, icon: AlertCircle, href: "/issues" },
    ];
    
    const getMenuItems = () => {
        const menu = [...baseMenuItems];
        if (userProfile?.role === 'Admin') {
            menu.push(...adminMenuItems);
        }
        return menu;
    };


    return (
        <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10">
                <div className="relative h-28 w-full">
                    <Image
                        src="https://picsum.photos/seed/more-page/1200/400"
                        alt="More page background"
                        fill
                        className="object-cover"
                        data-ai-hint="farm settings"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
                        <h1 className="text-lg font-bold">{dictionary.more.title}</h1>
                        <p className="mt-2 text-xs max-w-xl">{dictionary.more.description}</p>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 pb-20">
                {renderUserProfile()}

                <div className="grid grid-cols-2 gap-2">
                    {getMenuItems().map((item) => (
                        <Link
                            href={item.href}
                            key={item.label}
                            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary text-center"
                        >
                            <item.icon className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    ))}
                    
                    <LanguageSwitcher asGridItem={true} />

                    {user && (
                         <div
                            className="flex flex-col items-center justify-center gap-2 rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary text-center cursor-pointer"
                            onClick={onLogout}
                        >
                            <LogOut className="h-6 w-6 text-destructive" />
                            <span className="text-xs font-medium text-destructive">{dictionary.more.logout}</span>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
