import AppHeader from "@/components/layout/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function InboxPage() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col">
            <AppHeader showUserOptions={false} />
            <div className="flex w-full flex-1 flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex justify-end items-end gap-2">
                        <p className="max-w-[70%] rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                            नमस्कार, ही शेळी अजून उपलब्ध आहे का?
                        </p>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/seed/user1/100" />
                            <AvatarFallback>RP</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex justify-start items-end gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://picsum.photos/seed/user2/100" />
                            <AvatarFallback>SD</AvatarFallback>
                        </Avatar>
                        <p className="max-w-[70%] rounded-lg bg-muted px-4 py-2">
                            हो, उपलब्ध आहे.
                        </p>
                    </div>
                </div>
                <div className="mt-auto border-t bg-card p-4">
                    <div className="relative">
                        <Input placeholder="मेसेज टाइप करा..." className="pr-12" />
                        <Button size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
