
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Store, LogOut } from 'lucide-react';
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

  const isHomePage = pathname === '/';

  const renderUserOptions = () => {
    if (!isClient || authLoading) {
      return <Skeleton className="h-8 w-8 rounded-full bg-white/20" />;
    }
    if (user && userProfile) {
       return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-9 w-9 cursor-pointer border-2 border-white/80">
                  {user.photoURL && <AvatarImage src={user.photoURL} />}
                  <AvatarFallback className="font-bold bg-black/50 text-white">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}</AvatarFallback>
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
        <Button asChild variant={isHomePage ? 'outline' : 'default'} className={cn(isHomePage && 'border-white text-white hover:bg-white/20 hover:text-white')}>
            <Link href="/login">लॉगिन करा</Link>
        </Button>
    );
  }

  return (
    <header className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-end px-4",
        isHomePage ? 'absolute inset-x-0 bg-transparent' : 'border-b bg-card'
    )}>
      <div className="flex items-center gap-2">
        {renderUserOptions()}
      </div>
    </header>
  );
}
