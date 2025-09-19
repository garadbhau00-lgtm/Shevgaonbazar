import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.1 0-1.5.9-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
        </svg>
    )
}

export default function SignupPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Leaf className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">नवीन खाते तयार करा</CardTitle>
                    <CardDescription>
                        प्रारंभ करण्यासाठी तुमची माहिती प्रविष्ट करा
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">पूर्ण नाव</Label>
                            <Input id="name" placeholder="तुमचे नाव" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">ईमेल</Label>
                            <Input id="email" type="email" placeholder="तुमचा ईमेल पत्ता" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">पासवर्ड</Label>
                            <Input id="password" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">पासवर्डची पुष्टी करा</Label>
                            <Input id="confirm-password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full">
                           खाते तयार करा
                        </Button>
                    </form>
                    <div className="my-6 flex items-center">
                        <Separator className="flex-1" />
                        <span className="mx-4 text-xs text-muted-foreground">OR CONTINUE WITH</span>
                        <Separator className="flex-1" />
                    </div>
                    <Button variant="outline" className="w-full">
                        <GoogleIcon />
                        Sign up with Google
                    </Button>
                    <div className="mt-6 text-center text-sm">
                        आधीपासूनच खाते आहे?{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            लॉगिन करा
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
