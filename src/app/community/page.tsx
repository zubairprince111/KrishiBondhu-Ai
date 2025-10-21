
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppHeader } from '@/components/app-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SidebarInset } from '@/components/ui/sidebar';
import { ThumbsUp, MessageSquare, Send, LogIn, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-context';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, addDoc, updateDoc, arrayUnion, arrayRemove, query, orderBy, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { formatDistanceToNow } from 'date-fns';

const postFormSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.'),
});

const commentFormSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty.'),
});

function PostCard({ post }: { post: any }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);

  const postDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'community_posts', post.id);
  }, [firestore, post.id]);

  const commentsQuery = useMemoFirebase(() => {
    if (!postDocRef) return null;
    return query(collection(postDocRef, 'comments'), orderBy('timestamp', 'desc'));
  }, [postDocRef]);

  const { data: comments, isLoading: areCommentsLoading } = useCollection(commentsQuery);
  
  const commentForm = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: { content: '' },
  });

  const handleLike = () => {
    if (!user || !postDocRef) return;
    const hasLiked = post.likes?.includes(user.uid);
    updateDocumentNonBlocking(postDocRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const onCommentSubmit = (values: z.infer<typeof commentFormSchema>) => {
     if (!user || !commentsQuery) return;
    const commentData = {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorAvatarUrl: user.photoURL || '',
        content: values.content,
        timestamp: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'community_posts', post.id, 'comments'), commentData);
    commentForm.reset();
  };

  const hasLiked = user ? post.likes?.includes(user.uid) : false;
  const likeCount = post.likes?.length || 0;
  const commentCount = comments?.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
            <AvatarFallback>{post.authorName?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{post.content}</p>
        {post.imageURL && (
          <div className="relative h-64 w-full">
            <Image
              src={post.imageURL}
              alt="Post image"
              fill
              className="rounded-md object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-start gap-4 border-t pt-4">
        <Button variant={hasLiked ? 'default' : 'ghost'} size="sm" className="flex items-center gap-1" onClick={handleLike} disabled={!user}>
          <ThumbsUp className="size-4" />
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
        </Button>
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <MessageSquare className="size-4" />
              <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Comments on {post.authorName}'s post</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto space-y-4 p-4">
              {areCommentsLoading ? <Loader2 className="animate-spin" /> : comments?.map((comment: any) => (
                  <div key={comment.id} className="flex items-start gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={comment.authorAvatarUrl} />
                        <AvatarFallback>{comment.authorName?.charAt(0) || 'A'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-md bg-muted p-3">
                          <div className="flex items-baseline justify-between">
                            <p className="text-sm font-semibold">{comment.authorName}</p>
                            <p className="text-xs text-muted-foreground">{comment.timestamp ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'Just now'}</p>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                      </div>
                  </div>
              ))}
              {comments?.length === 0 && !areCommentsLoading && <p className="text-center text-muted-foreground">No comments yet.</p>}
            </div>
            {user && (
                 <Form {...commentForm}>
                    <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="flex items-start gap-2 pt-4 border-t">
                        <Avatar className="size-9">
                            <AvatarImage src={user.photoURL || ''} />
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <FormField control={commentForm.control} name="content" render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Textarea placeholder="Write a comment..." {...field} className="min-h-[40px]"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" size="icon" disabled={commentForm.formState.isSubmitting}>
                            <Send className="size-4"/>
                        </Button>
                    </form>
                </Form>
            )}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}


function NewPostCard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isPosting, setIsPosting] = useState(false);
  const postForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (values: z.infer<typeof postFormSchema>) => {
    if (!user || !firestore) return;
    setIsPosting(true);
    const postData = {
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous Farmer',
      authorAvatarUrl: user.photoURL || '',
      content: values.content,
      imageURL: '',
      timestamp: serverTimestamp(),
      likes: [],
    };

    addDocumentNonBlocking(collection(firestore, 'community_posts'), postData);
    postForm.reset();
    setIsPosting(false);
  };
  
  if (isUserLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="animate-spin text-primary"/>
        </CardContent>
      </Card>
    );
  }
  
  if (!user) {
      return (
          <Card>
               <CardHeader>
                  <CardTitle className="font-headline">Join the Conversation</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">You must be logged in to create a post.</p>
                  <Button asChild>
                      <Link href="/login">
                          <LogIn className="mr-2"/>
                          Login / Sign Up
                      </Link>
                  </Button>
              </CardContent>
          </Card>
      );
  }

  return (
      <Card>
          <CardHeader>
          <CardTitle className="font-headline">Share with the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...postForm}>
              <form onSubmit={postForm.handleSubmit(onSubmit)} className="grid w-full gap-2">
                <FormField control={postForm.control} name="content" render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Textarea placeholder="আপনার অভিজ্ঞতা বা প্রশ্ন শেয়ার করুন..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2" />}
                  Post
                </Button>
              </form>
            </Form>
          </CardContent>
      </Card>
  );
}

export default function CommunityPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'community_posts'), orderBy('timestamp', 'desc'));
  }, [firestore]);
  
  const { data: posts, isLoading: arePostsLoading } = useCollection(postsQuery);

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.community" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <NewPostCard />

          {arePostsLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>}

          {posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}
