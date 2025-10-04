
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, Home, User, Plus, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/language-context';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const { dictionary } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  const baseNavItems = [
    { href: '/', label: dictionary.bottomNav.home, icon: Home },
    { href: '/post-ad', label: dictionary.bottomNav.postAd, icon: Plus, requiresAuth: true },
    { href: '/my-ads', label: dictionary.bottomNav.myAds, icon: List, requiresAuth: true },
    { href: '/more', label: dictionary.bottomNav.more, icon: MoreHorizontal },
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showNav = isClient && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  if (!showNav) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 z-10 w-full max-w-lg">
      <div className="relative h-16 bg-card border-t">
        <nav className="grid h-full grid-cols-4 items-center">
          {baseNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isAuthProtected = item.requiresAuth && !user;
            const finalHref = isAuthProtected && !loading ? '/login' : item.href;

            if (pathname.startsWith('/inbox/')) {
                 if (item.href === '/inbox') return null;
                 const remainingItems = baseNavItems.filter(i => i.href !== '/inbox');
                 return (
                     <Link
                        key={item.href}
                        href={finalHref}
                        className={cn(
                        'group inline-flex h-full flex-col items-center justify-center text-center transition-colors',
                        isActive ? 'text-primary font-bold' : 'text-muted-foreground font-medium',
                        isAuthProtected && !loading && 'opacity-60',
                        `first:col-start-1 last:col-start-${remainingItems.length}`
                        )}
                    >
                         {item.href === '/' ? (
                            <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-full")}>
                                    <Avatar className={cn("h-7 w-7", isActive && 'ring-2 ring-primary')}>
                                        <AvatarImage src={userProfile?.photoURL || undefined} />
                                        <AvatarFallback>
                                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                                        </AvatarFallback>
                                    </Avatar>
                            </div>
                            ) : (
                                <item.icon className="h-5 w-5" />
                            )}
                            <span className="text-[11px] mt-1">{item.label}</span>
                    </Link>
                 );
            }

            return (
              <Link
                key={item.href}
                href={finalHref}
                className={cn(
                  'group inline-flex h-full flex-col items-center justify-center text-center transition-colors',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground font-medium',
                   isAuthProtected && !loading && 'opacity-60'
                )}
              >
                {item.href === '/' ? (
                   <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-full")}>
                        <Avatar className={cn("h-7 w-7", isActive && 'ring-2 ring-primary')}>
                             <AvatarImage src={userProfile?.photoURL || undefined} />
                             <AvatarFallback>
                               {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                             </AvatarFallback>
                        </Avatar>
                   </div>
                ) : (
                    <item.icon className="h-5 w-5" />
                )}
                <span className="text-[11px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
