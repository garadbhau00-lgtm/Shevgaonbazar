import { Bell, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <Button variant="ghost" size="icon">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">प्रोफाइल</span>
          </Button>
        </div>
      )}
    </header>
  );
}
