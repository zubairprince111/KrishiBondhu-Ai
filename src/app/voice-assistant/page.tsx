'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { AppHeader } from '@/components/app-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarInset } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Mic, Send, Sprout, User } from 'lucide-react';
import { getVoiceAssistance } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { SpeakingAnimation } from '@/components/speaking-animation';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'শুভ সকাল! আমি মাটি, আপনার কৃষি সহায়ক। আমি আপনাকে কিভাবে সাহায্য করতে পারি?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const { data, error } = await getVoiceAssistance({ query: currentInput });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error,
        });
        // Restore user input on error
        setInput(currentInput);
        setMessages(prev => prev.slice(0, -1));

      } else if (data) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    });
  };

  return (
    <SidebarInset>
      <AppHeader title="Voice Assistant (Mati AI)" />
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <div className="flex h-[calc(100vh-6rem)] flex-col">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="space-y-6 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sprout />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-md rounded-lg p-3',
                      message.role === 'user'
                        ? 'rounded-br-none bg-accent text-accent-foreground'
                        : 'rounded-bl-none bg-card'
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                     <Avatar>
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isPending && (
                <div className="flex items-start gap-3 justify-start">
                   <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sprout />
                      </AvatarFallback>
                    </Avatar>
                  <div className="rounded-lg p-3 bg-card flex items-center gap-2">
                    <SpeakingAnimation />
                    <span className="text-sm text-muted-foreground">Mati is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-4 border-t pt-4">
            <Card>
              <CardContent className="p-2">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="আপনার প্রশ্ন বাংলায় টাইপ করুন..."
                    className="max-h-24 flex-1 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    disabled={isPending}
                  />
                  <Button type="button" size="icon" variant="ghost" disabled={isPending}>
                    <Mic />
                  </Button>
                  <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
                    <Send />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}
