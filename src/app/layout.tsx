import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/layout/bottom-nav';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/contexts/language-context';
import AppHeader from '@/components/layout/app-header';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AdvertisementProvider } from '@/contexts/advertisement-context';

export const metadata: Metadata = {
  title: 'शेतकरी बाजार',
  description: 'तुमच्या स्थानिक शेतकरी समुदायाचे ह्रदय...',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr">
      <head>
        <title>शेतकरी बाजार</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')}>
        <LanguageProvider>
          <AuthProvider>
            <AdvertisementProvider>
              <FirebaseErrorListener />
              <div className="relative mx-auto flex min-h-screen max-w-lg flex-col border-x bg-background">
                <AppHeader />
                <main className="flex-1 flex flex-col">{children}</main>
                <BottomNav />
              </div>
              <Toaster />
            </AdvertisementProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

    
