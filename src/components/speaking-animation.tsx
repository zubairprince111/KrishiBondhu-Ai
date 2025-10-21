import { cn } from '@/lib/utils';

export function SpeakingAnimation() {
  return (
    <div className="relative flex h-5 w-5 items-center justify-center">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <span
            key={i}
            className={cn(
              'absolute h-full w-full rounded-full bg-primary',
              'animate-[ripple_1.5s_cubic-bezier(0,0.2,0.8,1)_infinite]'
            )}
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
        <style jsx>{`
            @keyframes ripple {
                from {
                    transform: scale(0.1);
                    opacity: 1;
                }
                to {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
        `}</style>
    </div>
  );
}
