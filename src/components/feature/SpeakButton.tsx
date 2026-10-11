// 全局发音按钮 - 可在任何地方使用
import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak, stopSpeak } from '@/lib/speech';
import { cn } from '@/lib/cn';

interface Props {
  text: string;
  rate?: number;
  lang?: string; // BCP-47 语言标签,默认 ja-JP
  className?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

export function SpeakButton({ text, rate = 0.85, lang = 'ja-JP', className, size = 'icon', variant = 'ghost' }: Props) {
  const [playing, setPlaying] = useState(false);
  if (!text) return null;
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('h-8 w-8', className)}
      aria-label="发音"
      onClick={() => {
        if (playing) {
          stopSpeak();
          setPlaying(false);
          return;
        }
        setPlaying(true);
        speak(text, { rate, lang, onEnd: () => setPlaying(false), onError: () => setPlaying(false) });
      }}
    >
      <Volume2 className={cn('h-4 w-4', playing && 'animate-pulse text-primary')} />
    </Button>
  );
}
