
'use client';

import { useAuth } from '@/hooks/use-auth';
import AppHeader from "@/components/layout/app-header";
import { ChevronRight, HelpCircle, LogIn, LogOut, Settings, User, UserPlus, ShieldCheck, ListChecks } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';


const baseMenuItems = [
    { label: "सेटिंग्स", icon: Settings, href: "#" },
    { label: "मदत केंद्र", icon: HelpCircle, href: "#" },
];

const adminMenuItems = [
    { label: "प्रवेश व्यवस्थापन", icon: ShieldCheck, href: "/access-management" },
    { label: "जाहिरात व्यवस्थापन", icon: ListChecks, href: "/ad-management" }
];

export default function MorePage() {
    const { user, userProfile, loading, handleLogout } = useAuth();
    const router = useRouter();

    const onLogout = async () => {
        await handleLogout();
        router.push('/login');
    }

    const getMenuItems = () => {
        if (loading) return [];
        if (user) {
            const menu = [
                { label: "माझे प्रोफाइल", icon: User, href: "#" },
                ...baseMenuItems
            ];
            if (userProfile?.role === 'Admin') {
                menu.push(...adminMenuItems);
            }
            menu.push({ label: "लॉगआउट", icon: LogOut, href: "#", action: onLogout });
            return menu;
        } else {
            return [
                { label: "लॉगिन करा", icon: LogIn, href: "/login" },
                { label: "साइन अप करा", icon: UserPlus, href: "/signup" },
                ...baseMenuItems,
            ];
        }
    };

    const menuItems = getMenuItems();

    if (loading) {
        return (
            <div>
                <AppHeader showUserOptions={false} />
                <div className="p-4 text-center">लोड होत आहे...</div>
            </div>
        )
    }

    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="p-4">
                {user && userProfile ? (
                    <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100`} alt="User" />
                            <AvatarFallback>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">{userProfile.name || 'वापरकर्ता'}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-lg bg-card p-6 text-center shadow-sm">
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
                )}


                <div className="mt-6 space-y-2">
                    {menuItems.map((item) => {
                        const isLink = !!item.href && !item.action;
                        const Component = isLink ? Link : 'div';

                        return (
                            <Component
                                href={item.href || '#'}
                                key={item.label}
                                className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
                                onClick={item.action}
                                style={{ cursor: item.action ? 'pointer' : 'default' }}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Component>
                        )
                    })}
                </div>
            </main>
        </div>
    );
}
