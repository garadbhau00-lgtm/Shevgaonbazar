
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
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const languages = [
    { value: 'mr', label: 'मराठी' },
    { value: 'hi', label: 'हिंदी' },
    { value: 'en', label: 'English' },
];

export default function LanguageSwitcherIcon() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white h-9 w-9">
                <Languages className="h-5 w-5"/>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
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
  );
}
