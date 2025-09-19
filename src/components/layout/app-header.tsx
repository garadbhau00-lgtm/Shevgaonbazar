import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type AppHeaderProps = {
    showUserOptions?: boolean;
}

export default function AppHeader({ showUserOptions = true }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4">
      <div className="text-xl font-bold text-primary">शेवगाव बाजार</div>
      {showUserOptions && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" />
            <span className="sr-only">सूचना</span>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">लॉगिन करा</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
