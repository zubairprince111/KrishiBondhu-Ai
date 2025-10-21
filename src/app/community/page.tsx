'use client';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset } from '@/components/ui/sidebar';
import { ThumbsUp, MessageSquare, Send } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-context';

const posts = [
  {
    id: 1,
    author: 'Abdul Karim',
    avatarId: 'avatar-1',
    time: '2 hours ago',
    content: 'এই বছর ধানের ফলন খুব ভালো হয়েছে। মাটি পরীক্ষার ফলাফল আমাকে সঠিক সার ব্যবহার করতে সাহায্য করেছে।',
    imageId: 'community-post-1',
    likes: 15,
    comments: 4,
  },
  {
    id: 2,
    author: 'Fatima Begum',
    avatarId: 'avatar-3',
    time: '5 hours ago',
    content: 'আমার টমেটো গাছে এই পোকা দেখা যাচ্ছে। কেউ কি কোন সমাধান দিতে পারেন?',
    likes: 8,
    comments: 12,
  },
];

export default function CommunityPage() {
  const getImage = (id: string) => PlaceHolderImages.find(p => p.id === id);
  const { t } = useLanguage();

  return (
    <SidebarInset>
      <AppHeader titleKey="app.header.title.community" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Share with the Community</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-2">
                <Textarea placeholder="আপনার অভিজ্ঞতা বা প্রশ্ন শেয়ার করুন..." />
                <Button>
                  <Send className="mr-2" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {posts.map((post) => {
            const avatar = getImage(post.avatarId);
            const postImage = post.imageId ? getImage(post.imageId) : undefined;
            return (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {avatar && (
                      <Avatar>
                        <AvatarImage src={avatar.imageUrl} alt={post.author} data-ai-hint={avatar.imageHint} />
                        <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-semibold">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{post.content}</p>
                  {postImage && (
                     <div className="relative h-64 w-full">
                        <Image
                            src={postImage.imageUrl}
                            alt={postImage.description}
                            data-ai-hint={postImage.imageHint}
                            fill
                            className="rounded-md object-cover"
                        />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-start gap-4 border-t pt-4">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <ThumbsUp className="size-4" />
                    <span>{post.likes} Likes</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="size-4" />
                    <span>{post.comments} Comments</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>
    </SidebarInset>
  );
}
