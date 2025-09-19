import AppHeader from "@/components/layout/app-header";
import { ChevronRight, HelpCircle, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
    { label: "माझे प्रोफाइल", icon: User, href: "#" },
    { label: "सेटिंग्स", icon: Settings, href: "#" },
    { label: "मदत केंद्र", icon: HelpCircle, href: "#" },
    { label: "लॉगआउट", icon: LogOut, href: "#" },
];

export default function MorePage() {
    return (
        <div>
            <AppHeader showUserOptions={false} />
            <main className="p-4">
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
