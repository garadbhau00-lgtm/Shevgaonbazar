
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Store, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const { user, userProfile, loading: authLoading, handleLogout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
  };

  const renderUserOptions = () => {
    if (!isClient || authLoading) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (user && userProfile) {
       return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="h-8 w-8 cursor-pointer">
                  {user.photoURL && <AvatarImage src={user.photoURL} />}
                  <AvatarFallback className="font-bold bg-black text-white">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}</AvatarFallback>
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
        <Button asChild variant="default" className="bg-black text-white border-black hover:bg-black/80 hover:text-white">
            <Link href="/login">लॉगिन करा</Link>
        </Button>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4">
      <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
        <Store className="h-6 w-6" />
        <span>शेवगाव बाजार</span>
      </Link>
      <div className="flex items-center gap-2">
        {renderUserOptions()}
      </div>
    </header>
  );
}
