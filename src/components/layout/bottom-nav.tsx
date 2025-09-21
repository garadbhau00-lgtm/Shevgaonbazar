'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LayoutList, Menu, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';

const baseNavItems = [
  { href: '/', label: 'होम', icon: Home },
  { href: '/post-ad', label: 'जाहिरात टाका', icon: PlusCircle, requiresAuth: true },
  { href: '/my-ads', label: 'माझ्या जाहिराती', icon: LayoutList, requiresAuth: true },
];

const authenticatedNavItems = [
  ...baseNavItems,
  { href: '/more', label: 'अधिक', icon: Menu },
];

const unauthenticatedNavItems = [
    { href: '/', label: 'होम', icon: Home },
    { href: '/post-ad', label: 'जाहिरात टाका', icon: PlusCircle, requiresAuth: true },
    { href: '/my-ads', label: 'माझ्या जाहिराती', icon: LayoutList, requiresAuth: true },
    { href: '/more', label: 'अधिक', icon: Menu },
];


export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [navItems, setNavItems] = useState(baseNavItems);

  useEffect(() => {
    if (!loading) {
       setNavItems(unauthenticatedNavItems);
    }
  }, [user, loading]);

  if (pathname.startsWith('/inbox/')) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 z-10 w-full max-w-lg border-t bg-card">
      <div className={`grid h-16 font-medium grid-cols-${navItems.length}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isAuthProtected = item.requiresAuth && !user;

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (isAuthProtected) {
                  e.preventDefault();
                  // Optionally, redirect to login or show a toast
                  // This example assumes useAuth or a similar hook handles the redirect/toast
              }
          };

          return (
            <Link
              key={item.href}
              href={isAuthProtected ? '/login' : item.href}
              onClick={handleClick}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-5 transition-colors hover:bg-secondary',
                isActive ? 'text-primary' : 'text-muted-foreground',
                isAuthProtected && 'opacity-50 cursor-not-allowed'
              )}
            >
              <item.icon className={cn("mb-1 h-6 w-6", item.href === '/post-ad' && 'h-7 w-7')} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
