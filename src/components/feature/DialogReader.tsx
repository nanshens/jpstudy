import { useState } from 'react';
import { Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpeakButton } from './SpeakButton';
import { speak, stopSpeak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { Dialog } from '@/types';

interface Props {
  dialog: Dialog;
}

export function DialogReader({ dialog }: Props) {
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  async function playSequence() {
    if (autoPlay) {
      stopSpeak();
      setAutoPlay(false);
      setActiveIdx(null);
      return;
    }
    setAutoPlay(true);
    for (let i = 0; i < dialog.lines.length; i++) {
      if (!autoPlay && i > 0) {
        // 用户中途点停后会读到下一行才停下
      }
      setActiveIdx(i);
      await new Promise<void>((resolve) => {
        speak(dialog.lines[i].jp, {
          rate: 0.85,
          onEnd: () => resolve(),
          onError: () => resolve(),
        });
      });
      await new Promise((r) => setTimeout(r, 400));
    }
    setActiveIdx(null);
    setAutoPlay(false);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold">{dialog.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{dialog.scene}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoPlay ? 'destructive' : 'default'}
            size="sm"
            onClick={playSequence}
          >
            <Play className="h-4 w-4" />
            {autoPlay ? '停止' : '整段播放'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMeaning((v) => !v)}
          >
            {showMeaning ? '隐藏译文' : '显示译文'}
          </Button>
        </div>
      </div>
      <div className="space-y-2.5">
        {dialog.lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 rounded-md p-2.5 transition-colors',
              activeIdx === i && 'bg-primary/10 ring-1 ring-primary/30',
              line.speaker === '私' ? 'flex-row-reverse text-right' : '',
            )}
          >
            <div className="shrink-0 w-14 text-xs font-semibold text-muted-foreground flex items-start pt-1">
              {line.speaker}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="jp text-base font-medium">{line.jp}</span>
                <span className="jp text-xs text-muted-foreground">{line.reading}</span>
              </div>
              {showMeaning && (
                <div className="text-sm text-muted-foreground mt-1">{line.meaning}</div>
              )}
              {line.note && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  💡 {line.note}
                </div>
              )}
            </div>
            <div className="shrink-0">
              <SpeakButton text={line.jp} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
