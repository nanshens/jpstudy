import { useState } from 'react';
import { Play, RotateCcw, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { ListeningItem } from '@/types';

interface Props {
  item: ListeningItem;
  index: number;
  total: number;
  onNext?: () => void;
}

export function ListeningPlayer({ item, index, total, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  function play() {
    speak(item.audio, { rate: 0.9 });
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <span>听力题 {index + 1} / {total}</span>
        {revealed && (
          <span className={cn('font-semibold', picked === item.options.indexOf(item.answer) ? 'text-emerald-600' : 'text-destructive')}>
            {picked === item.options.indexOf(item.answer) ? '✓ 答对了' : '✗ 答错了'}
          </span>
        )}
      </div>

      <div className="rounded-lg bg-muted/60 p-5 flex flex-col items-center justify-center gap-3 mb-4">
        <Button onClick={play} size="lg" className="rounded-full h-14 w-14 p-0">
          <Play className="h-6 w-6" />
        </Button>
        <p className="text-sm text-muted-foreground">点击播放,再听一次</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={play}
        >
          <RotateCcw className="h-3 w-3" /> 再听一次
        </Button>
      </div>

      <p className="text-sm font-medium mb-3">{item.question}</p>

      <div className="space-y-2">
        {item.options.map((opt, i) => {
          const correct = opt === item.answer;
          const isPicked = picked === i;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => {
                setPicked(i);
                setRevealed(true);
              }}
              className={cn(
                'w-full text-left rounded-md border p-3 text-sm transition-all',
                !revealed && isPicked && 'border-primary bg-primary/5',
                !revealed && !isPicked && 'hover:bg-accent',
                revealed && correct && 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
                revealed && isPicked && !correct && 'border-destructive bg-destructive/10',
              )}
            >
              <span className="inline-flex items-center gap-2">
                {revealed && correct && <Check className="h-4 w-4 text-emerald-600" />}
                {revealed && isPicked && !correct && <X className="h-4 w-4 text-destructive" />}
                {String.fromCharCode(65 + i)}. {opt}
              </span>
            </button>
          );
        })}
      </div>

      {revealed && item.explanation && (
        <div className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
          💡 {item.explanation}
        </div>
      )}

      {revealed && onNext && (
        <div className="mt-4 flex justify-end">
          <Button onClick={onNext}>下一题 →</Button>
        </div>
      )}
    </Card>
  );
}
