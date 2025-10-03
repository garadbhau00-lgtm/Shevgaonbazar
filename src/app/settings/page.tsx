
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SettingsForm from './_components/settings-form';

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SettingsForm />
    </Suspense>
  );
}
