
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Bell, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppNotification } from '@/lib/types';
import LanguageSwitcherIcon from '../language-switcher-icon';

export default function AppHeader() {
  const { user, userProfile, loading: authLoading, handleLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnread(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user]);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

  const isTransparentPage = ['/', '/post-ad', '/my-ads', '/more', '/search', '/ad-management', '/access-management', '/help-center', '/settings', '/notifications', '/broadcast', '/inbox', '/my-issues', '/saved-ads', '/advertisement', '/issues'].includes(pathname);
  const isAdDetailPage = /^\/ad\//.test(pathname);
  const isChatPage = /^\/inbox\//.test(pathname);
  
  if (isAdDetailPage || isChatPage) {
    return null; // These pages have their own headers
  }


  const renderUserOptions = () => {
    if (!isClient || authLoading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (user && userProfile) {
       return (
        <>
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className={cn("relative rounded-full h-9 w-9", isTransparentPage ? 'text-white hover:bg-white/20 hover:text-white' : 'text-primary')}>
              <Bell className="h-5 w-5"/>
              {hasUnread && <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className={cn("h-9 w-9 cursor-pointer border-2", isTransparentPage ? 'border-primary-foreground/50' : 'border-primary/50')}>
                  <AvatarImage src={userProfile.photoURL || undefined} />
                  <AvatarFallback className={cn("font-bold", isTransparentPage ? 'bg-transparent text-primary-foreground' : 'bg-muted text-primary')}>{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>{userProfile.name || user.email}</p>
                {userProfile.name && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/my-ads')}>
                माझ्या जाहिराती
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/more')}>
                More Options
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>लॉगआउट</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }
    return (
        <Button asChild size="sm" className="h-auto px-2 py-0.5 text-[11px] leading-none">
            <Link href="/login">लॉगिन</Link>
        </Button>
    );
  }

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 max-w-lg mx-auto")}>
       <div className="flex items-center">
            {isTransparentPage && <LanguageSwitcherIcon />}
       </div>
      <div className="flex items-center gap-2">
        {renderUserOptions()}
      </div>
    </header>
  );
}
