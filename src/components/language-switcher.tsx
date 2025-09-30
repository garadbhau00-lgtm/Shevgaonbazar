
'use client';

import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/language-context';

const languages = [
    { value: 'mr', label: 'मराठी' },
    { value: 'hi', label: 'हिंदी' },
    { value: 'en', label: 'English' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, dictionary } = useLanguage();

  return (
    <div className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-secondary">
        <div className="flex items-center gap-4">
            <Languages className="h-5 w-5 text-primary" />
            <span className="font-medium">{dictionary.more.language}</span>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="font-medium text-primary">
                    {languages.find(l => l.value === language)?.label}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                value={language}
                onValueChange={(value) => setLanguage(value as 'en' | 'hi' | 'mr')}
                >
                {languages.map((lang) => (
                    <DropdownMenuRadioItem key={lang.value} value={lang.value}>
                    {lang.label}
                    </DropdownMenuRadioItem>
                ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
}
