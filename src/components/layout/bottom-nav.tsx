
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, LayoutList, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';

const baseNavItems = [
  { href: '/', label: 'होम', icon: Home },
  { href: '/post-ad', label: 'जाहिरात टाका', icon: PlusCircle, requiresAuth: true },
  { href: '/my-ads', label: 'माझ्या जाहिराती', icon: LayoutList, requiresAuth: true },
  { href: '/more', label: 'अधिक', icon: Menu },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showNav = isClient && !pathname.startsWith('/login') && !pathname.startsWith('/signup');

  if (!showNav) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 z-10 w-full max-w-lg border-t bg-card">
      <div className="p-2 border-b">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="जाहिरात शोधा..." className="pl-10 bg-secondary text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>
      <nav>
        <div className={`grid h-14 font-medium grid-cols-${baseNavItems.length}`}>
          {baseNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isAuthProtected = item.requiresAuth && !user;

            return (
              <Link
                key={item.href}
                href={isAuthProtected && !loading ? '/login' : item.href}
                className={cn(
                  'group inline-flex flex-col items-center justify-center px-3 transition-colors hover:bg-secondary',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  isAuthProtected && !loading && 'opacity-60'
                )}
              >
                <item.icon className="mb-0.5 h-5 w-5" />
                <span className="text-[11px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
