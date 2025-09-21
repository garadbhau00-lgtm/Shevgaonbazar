
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const { user, userProfile, loading: authLoading, handleLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

  const isTransparentPage = ['/', '/post-ad', '/my-ads', '/more', '/search', '/ad-management', '/access-management', '/help-center', '/settings'].includes(pathname);

  const renderUserOptions = () => {
    if (!isClient || authLoading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (user && userProfile) {
       return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className={cn("h-9 w-9 cursor-pointer border-2", isTransparentPage ? 'border-primary-foreground/50' : 'border-primary/50')}>
                  {user.photoURL && <AvatarImage src={user.photoURL} />}
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
      );
    }
    return (
        <Button asChild>
            <Link href="/login">लॉगिन करा</Link>
        </Button>
    );
  }

  return (
    <header className={cn(
        "flex h-16 items-center justify-end px-4 z-10",
        isTransparentPage ? 'absolute top-0 right-0' : 'border-b bg-card'
    )}>
      <div className="flex items-center gap-2">
        {renderUserOptions()}
      </div>
    </header>
  );
}
