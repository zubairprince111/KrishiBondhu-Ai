
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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState< 'signIn' | 'signUp' | 'anonymous' | null >(null);
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

  const onSignUp = (values: z.infer<typeof signUpSchema>) => {
    setIsLoading('signUp');
    // We don't await here. onAuthStateChanged will handle the redirect.
    initiateEmailSignUp(auth, values.email, values.password);
    // Monitor for errors specifically
    auth.onAuthStateChanged(user => {
      if (!user) { // Error state will be handled here if signup fails
          const unsubscribe = auth.onAuthStateChanged(() => {}); // Dummy to get error
          // This is a bit of a workaround to catch the error from the non-blocking call
          setTimeout(() => {
              const authError = (auth as any)._error;
              if (authError) handleError(authError as AuthError);
              unsubscribe();
          }, 1500);
      } else {
        router.push('/');
      }
    });
  };

  const onSignIn = (values: z.infer<typeof signInSchema>) => {
    setIsLoading('signIn');
    initiateEmailSignIn(auth, values.email, values.password);
     auth.onAuthStateChanged(user => {
      if (user) {
        router.push('/');
      } else {
          const unsubscribe = auth.onAuthStateChanged(() => {});
           setTimeout(() => {
              const authError = (auth as any)._error;
              if (authError) handleError(authError as AuthError);
              unsubscribe();
          }, 1500);
      }
    });
  };

  const onAnonymousSignIn = () => {
    setIsLoading('anonymous');
    initiateAnonymousSignIn(auth);
    auth.onAuthStateChanged(user => {
      if (user) router.push('/');
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2">
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
                <span className="bg-background px-2 text-muted-foreground">Or continue as a guest</span>
            </div>
        </div>
        <Button variant="secondary" className="w-full" onClick={onAnonymousSignIn} disabled={!!isLoading}>
            {isLoading === 'anonymous' ? <Loader2 className="animate-spin" /> : <><VenetianMask className="mr-2"/>Continue as Guest</>}
        </Button>
      </div>
    </div>
  );
}
