'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, PlusCircle, LayoutList, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'होम', icon: Home },
  { href: '/inbox', label: 'इनबॉक्स', icon: MessageSquare },
  { href: '/post-ad', label: 'जाहिरात टाका', icon: PlusCircle },
  { href: '/my-ads', label: 'माझ्या जाहिराती', icon: LayoutList },
  { href: '/more', label: 'अधिक', icon: Menu },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-10 w-full max-w-lg border-t bg-card">
      <div className="grid h-16 grid-cols-5 font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex flex-col items-center justify-center px-5 transition-colors hover:bg-secondary',
                isActive ? 'text-primary' : 'text-muted-foreground'
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
