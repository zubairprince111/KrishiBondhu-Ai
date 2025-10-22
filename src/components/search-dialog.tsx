
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Wand2 } from 'lucide-react';
import { universalSearch } from '@/lib/actions';
import type { UniversalSearchOutput } from '@/ai/flows/universal-search-flow';
import { useLanguage } from '@/context/language-context';

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  setInitialQuery?: (query: string) => void;
};

export function SearchDialog({ open, onOpenChange, initialQuery = '', setInitialQuery }: SearchDialogProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UniversalSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if(open && initialQuery) {
        setQuery(initialQuery);
        handleSearch(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  const handleSearch = useCallback((currentQuery: string) => {
    if (!currentQuery.trim()) return;

    setResult(null);
    setError(null);
    startTransition(async () => {
      const { data, error } = await universalSearch({ query: currentQuery });
      if (error) {
        setError(error);
      } else {
        setResult(data);
      }
    });
    if(setInitialQuery) setInitialQuery('');
  }, [setInitialQuery]);


  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
        setQuery('');
        setResult(null);
        setError(null);
        if(setInitialQuery) setInitialQuery('');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{t('searchDialog.title')}</DialogTitle>
          <DialogDescription>{t('searchDialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onFormSubmit}>
            <div className="relative">
                <Input 
                    placeholder={t('searchDialog.placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isPending}>
                    <Search className="size-4"/>
                </Button>
            </div>
        </form>
        <div className="mt-4 min-h-[200px] rounded-lg border bg-muted/50 p-4">
            {isPending && (
                <div className="flex flex-col items-center justify-center h-full text-primary">
                    <Loader2 className="size-8 animate-spin"/>
                    <p className="mt-2 text-sm">{t('searchDialog.loading')}</p>
                </div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center h-full text-destructive">
                    <p>{t('searchDialog.error.title')}</p>
                    <p className="text-xs">{error}</p>
                </div>
            )}
            {result && (
                <div className="space-y-4">
                    <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                        <Wand2 className="text-primary"/>
                        {result.title}
                    </h3>
                    <div
                        className="prose prose-sm prose-p:leading-relaxed dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: result.response.replace(/\n/g, '<br />') }}
                    />
                </div>
            )}
            {!isPending && !result && !error && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>{t('searchDialog.results.placeholder')}</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    