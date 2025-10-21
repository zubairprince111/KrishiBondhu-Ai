
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AppHeader } from '@/components/app-header';
import { SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarInset>
      <AppHeader titleKey="sidebar.nav.profile" />
      <main className="flex-1 p-4 md:p-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto flex justify-center">
                <Avatar className="size-24">
                  <AvatarFallback className="text-4xl">
                    {user.isAnonymous ? <UserIcon /> : user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>
            <CardTitle className="mt-4 font-headline text-2xl">
              {user.isAnonymous ? 'Guest User' : user.email}
            </CardTitle>
            <CardDescription>
              {user.isAnonymous ? "Sign up to personalize your profile." : "Manage your profile information below."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-background/50 p-6">
                 <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={user.email || 'Not available for guest users'} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="uid">User ID</Label>
                    <Input id="uid" value={user.uid} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" disabled={user.isAnonymous} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Dhaka, Bangladesh" disabled={user.isAnonymous} />
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={user.isAnonymous}>Save Changes</Button>
                <Button variant="destructive-outline" className="flex-1" onClick={handleLogout}>
                    <LogOut className="mr-2"/>
                    Logout
                </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}

