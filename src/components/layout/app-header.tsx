
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

type AppHeaderProps = {
    showUserOptions?: boolean;
}

export default function AppHeader({ showUserOptions = true }: AppHeaderProps) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="text-xl font-bold text-primary">शेवगाव बाजार</div>
      {showUserOptions && (
        <div className="flex items-center gap-2">
          {!user && (
            <Button asChild variant="outline">
              <Link href="/login">लॉगिन करा</Link>
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
