
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Star, MoreHorizontal, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const baseNavItems = [
  { href: '/', label: 'होम', icon: Home },
  { href: '/inbox', label: 'इनबॉक्स', icon: Mail, requiresAuth: true },
  { href: '/post-ad', label: 'जाहिरात टाका', icon: null, requiresAuth: true, isFab: true },
  { href: '/my-ads', label: 'माझ्या जाहिराती', icon: Star, requiresAuth: true },
  { href: '/more', label: 'अधिक', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, userProfile, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showNav = isClient && !pathname.startsWith('/login') && !pathname.startsWith('/signup') && !pathname.startsWith('/inbox/');

  if (!showNav) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 z-10 w-full max-w-lg">
      <div className="relative h-16 bg-card border-t">
        <nav className="grid h-full grid-cols-5 items-center">
          {baseNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isAuthProtected = item.requiresAuth && !user;
            const finalHref = isAuthProtected && !loading ? '/login' : item.href;

            if (item.isFab) {
                return (
                    <div key={item.href} className="relative flex justify-center items-center">
                        <Link href={finalHref}>
                           <div className="absolute bottom-2 flex h-16 w-16 items-center justify-center rounded-full bg-card">
                             <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                             </div>
                           </div>
                        </Link>
                    </div>
                )
            }

            return (
              <Link
                key={item.href}
                href={finalHref}
                className={cn(
                  'group inline-flex flex-col items-center justify-center text-center transition-colors',
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground font-medium',
                   isAuthProtected && !loading && 'opacity-60'
                )}
              >
                {item.href === '/' ? (
                   <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-full", isActive && 'bg-destructive/20')}>
                        <Avatar className={cn("h-7 w-7", isActive && 'ring-2 ring-destructive')}>
                             <AvatarImage src={user?.photoURL || undefined} />
                             <AvatarFallback>
                               {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <User className="h-4 w-4"/>}
                             </AvatarFallback>
                        </Avatar>
                        {isActive && <div className="absolute -top-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-destructive"></div>}
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
