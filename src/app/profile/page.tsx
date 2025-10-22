
'use client';

import { useEffect, useState } from 'react';
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
import { useAuth, useFirestore } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user && user.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSaveChanges = async () => {
    if (!user || user.isAnonymous) return;
    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName });

      // Update Firestore user document
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { name: displayName }, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your name has been saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
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
                    {user.isAnonymous ? <UserIcon /> : (user.displayName || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>
            <CardTitle className="mt-4 font-headline text-2xl">
              {user.isAnonymous ? 'Guest User' : user.displayName || user.email}
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
                    <Input 
                      id="name" 
                      placeholder="Enter your full name" 
                      disabled={user.isAnonymous || isSaving} 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Dhaka, Bangladesh" disabled={user.isAnonymous} />
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={user.isAnonymous || isSaving} onClick={handleSaveChanges}>
                  {isSaving ? <Loader2 className="mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
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
