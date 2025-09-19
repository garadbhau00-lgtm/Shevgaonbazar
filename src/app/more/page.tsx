import AppHeader from "@/components/layout/app-header";
import { ChevronRight, HelpCircle, LogIn, LogOut, Settings, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItemsLoggedIn = [
    { label: "माझे प्रोफाइल", icon: User, href: "#" },
    { label: "सेटिंग्स", icon: Settings, href: "#" },
    { label: "मदत केंद्र", icon: HelpCircle, href: "#" },
    { label: "लॉगआउट", icon: LogOut, href: "#" },
];

const menuItemsLoggedOut = [
    { label: "लॉगिन करा", icon: LogIn, href: "/login" },
    { label: "साइन अप करा", icon: UserPlus, href: "/signup" },
    { label: "मदत केंद्र", icon: HelpCircle, href: "#" },
];


// This is a mock. In a real app, you'd get this from your auth state.
const isLoggedIn = false;


export default function MorePage() {
    const menuItems = isLoggedIn ? menuItemsLoggedIn : menuItemsLoggedOut;
    
    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="p-4">
                {isLoggedIn ? (
                    <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-sm">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src="https://picsum.photos/seed/user1/100" alt="User" />
                            <AvatarFallback>RP</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-xl font-bold">राम पाटील</h2>
                            <p className="text-muted-foreground">९८७६५४३२१०</p>
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
                    {menuItems.map((item) => (
                        <Link href={item.href} key={item.label} className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary">
                            <div className="flex items-center gap-4">
                                <item.icon className="h-5 w-5 text-primary" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
