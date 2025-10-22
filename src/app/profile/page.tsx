
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
import { Loader2, User as UserIcon, LogOut, Key } from 'lucide-react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';

export default function ProfilePage() {
  const { t } = useLanguage();
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
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };

  const handleSaveChanges = async () => {
    if (!user || user.isAnonymous || !firestore) return;
    setIsSaving(true);
    
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });

        const userDocRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userDocRef, { name: displayName }, { merge: true });
      }

      toast({
        title: t('profile.toast.success.title'),
        description: t('profile.toast.success.description'),
      });
    } catch (error) {
       console.error('Error updating auth profile:', error);
       toast({
        variant: 'destructive',
        title: t('profile.toast.error.title'),
        description: t('profile.toast.error.description'),
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
                    {user.isAnonymous ? <UserIcon /> : (displayName || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>
            <CardTitle className="mt-4 font-headline text-2xl">
              {user.isAnonymous ? t('profile.guest.title') : displayName || user.email}
            </CardTitle>
            <CardDescription>
              {user.isAnonymous ? t('profile.guest.description') : t('profile.user.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border bg-background/50 p-6">
                 <div className="space-y-2">
                    <Label htmlFor="email">{t('profile.form.email.label')}</Label>
                    <Input id="email" value={user.email || t('profile.form.email.guestPlaceholder')} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="uid">{t('profile.form.uid.label')}</Label>
                    <Input id="uid" value={user.uid} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.form.name.label')}</Label>
                    <Input 
                      id="name" 
                      placeholder={t('profile.form.name.placeholder')}
                      disabled={user.isAnonymous || isSaving} 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="location">{t('profile.form.location.label')}</Label>
                    <Input id="location" placeholder={t('profile.form.location.placeholder')} disabled={user.isAnonymous} />
                </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" disabled={user.isAnonymous || isSaving} onClick={handleSaveChanges}>
                  {isSaving ? <Loader2 className="mr-2 animate-spin" /> : null}
                  {t('profile.button.save')}
                </Button>
                <Button variant="destructive-outline" className="flex-1" onClick={handleLogout}>
                    <LogOut className="mr-2"/>
                    {t('profile.button.logout')}
                </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
