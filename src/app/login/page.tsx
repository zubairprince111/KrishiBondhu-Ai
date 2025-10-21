
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateAnonymousSignIn,
  initiateGoogleSignIn,
} from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sprout, LogIn, UserPlus, VenetianMask, Loader2 } from 'lucide-react';
import { AuthError, AuthErrorCodes } from 'firebase/auth';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const GoogleIcon = () => (
    <svg className="size-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.86 3.28-7.84 3.28-5.74 0-10.4-4.57-10.4-10.33s4.66-10.33 10.4-10.33c3.34 0 5.38 1.34 6.6 2.52l2.84-2.78C19.11 1.76 16.25 0 12.48 0 5.88 0 0 5.74 0 12.42s5.88 12.42 12.48 12.42c7.2 0 12.12-4.13 12.12-12.36 0-.8-.08-1.55-.2-2.18z" />
    </svg>
);


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState< 'signIn' | 'signUp' | 'anonymous' | 'google' | null >(null);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleError = (error: AuthError) => {
    setIsLoading(null);
    let description = 'An unexpected error occurred. Please try again.';
    
    // Don't show a toast for user-cancelled popups
    if (error.code === AuthErrorCodes.POPUP_CLOSED_BY_USER) {
        return;
    }
    
    if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
        description = 'An account with this email already exists. Please sign in instead.';
    } else if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        description = 'Invalid email or password. Please check your credentials and try again.';
    } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
        description = 'The password is too weak. Please use at least 6 characters.';
    }

    toast({
      variant: 'destructive',
      title: 'Authentication Failed',
      description,
    });
  };
  
  const handleAuthRedirect = (user: any) => {
      if (user) {
        router.push('/');
      } else {
        // This is a workaround to catch errors from non-blocking sign-in calls.
        const unsubscribe = auth.onAuthStateChanged(() => {});
        setTimeout(() => {
          const authError = (auth as any)._error;
          if (authError) {
            handleError(authError as AuthError)
          } else {
            // If there's no error after timeout, but also no user,
            // it's likely a silent failure or popup close. Reset loading state.
            setIsLoading(null);
          }
          unsubscribe();
        }, 1500);
      }
  }

  const onSignUp = (values: z.infer<typeof signUpSchema>) => {
    setIsLoading('signUp');
    initiateEmailSignUp(auth, values.email, values.password);
    auth.onAuthStateChanged(handleAuthRedirect);
  };

  const onSignIn = (values: z.infer<typeof signInSchema>) => {
    setIsLoading('signIn');
    initiateEmailSignIn(auth, values.email, values.password);
     auth.onAuthStateChanged(handleAuthRedirect);
  };

  const onAnonymousSignIn = () => {
    setIsLoading('anonymous');
    initiateAnonymousSignIn(auth);
    auth.onAuthStateChanged(handleAuthRedirect);
  };

  const onGoogleSignIn = () => {
    setIsLoading('google');
    initiateGoogleSignIn(auth);
    auth.onAuthStateChanged(handleAuthRedirect);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
                <Sprout className="size-10 text-primary" />
                <h1 className="font-headline text-4xl font-semibold text-primary">KrishiBondhu</h1>
            </div>
            <p className="text-muted-foreground">Your AI farming companion. Sign in to personalize your experience.</p>
        </div>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin"><LogIn className="mr-2"/>Sign In</TabsTrigger>
            <TabsTrigger value="signup"><UserPlus className="mr-2"/>Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Welcome back! Please enter your details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                    <FormField control={signInForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="farmer@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signInForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={!!isLoading}>
                      {isLoading === 'signIn' ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>Join our community to get personalized advice.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                     <FormField control={signUpForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="farmer@example.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={!!isLoading}>
                      {isLoading === 'signUp' ? <Loader2 className="animate-spin" /> : 'Sign Up'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={onGoogleSignIn} disabled={!!isLoading}>
                {isLoading === 'google' ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
            </Button>
            <Button variant="secondary" onClick={onAnonymousSignIn} disabled={!!isLoading}>
                {isLoading === 'anonymous' ? <Loader2 className="animate-spin" /> : <><VenetianMask className="mr-2"/>Guest</>}
            </Button>
        </div>
      </div>
    </div>
  );
}
