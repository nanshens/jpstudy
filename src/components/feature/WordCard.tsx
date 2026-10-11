import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SpeakButton } from './SpeakButton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { WordEntry } from '@/types';
import { getProgress, setProgress } from '@/lib/storage';

interface Props {
  scenarioId: string;
  word: WordEntry;
}

export function WordCard({ scenarioId, word }: Props) {
  const [flipped, setFlipped] = useState(false);
  const progress = getProgress(scenarioId);
  const known = progress.knownWords.includes(word.id);

  function toggleKnown() {
    const cur = getProgress(scenarioId);
    const next = cur.knownWords.includes(word.id)
      ? cur.knownWords.filter((id) => id !== word.id)
      : [...cur.knownWords, word.id];
    setProgress(scenarioId, { knownWords: next });
    // 触发重渲染
    setFlipped((v) => v);
  }

  return (
    <Card
      className={cn(
        'group relative cursor-pointer select-none overflow-hidden p-4 transition-all hover:shadow-md',
        known && 'ring-1 ring-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20',
      )}
      onClick={() => setFlipped((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="jp text-2xl font-semibold leading-tight tracking-tight">{word.jp}</span>
            <span className="jp text-sm text-muted-foreground">{word.reading}</span>
          </div>
          {/* 片假名英文辅助 (始终显示在正面) */}
          {word.en && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="font-mono text-sm font-medium text-sky-600 dark:text-sky-400">
                {word.en}
              </span>
              <SpeakButton text={word.en} lang="en-US" className="h-5 w-5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950" size="icon" />
            </div>
          )}
          <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {flipped || known ? (
              <span className="text-foreground">{word.meaning}</span>
            ) : (
              <span className="italic">点击翻面查看意思</span>
            )}
          </div>
          {flipped && word.example && (
            <div className="mt-3 rounded-md bg-muted/50 p-2.5 text-xs">
              <div className="flex items-baseline gap-1.5">
                <span className="jp font-medium">{word.example.jp}</span>
                <span className="jp text-muted-foreground text-[10px]">{word.example.reading}</span>
              </div>
              <div className="text-muted-foreground mt-0.5">{word.example.meaning}</div>
            </div>
          )}
          {flipped && word.note && (
            <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
              <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{word.note}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <SpeakButton text={word.jp} />
          {word.tag && word.tag[0] && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {word.tag[0]}
            </Badge>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleKnown();
        }}
        className={cn(
          'absolute bottom-2 right-2 rounded-full p-1.5 transition-colors',
          known ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-emerald-100',
        )}
        aria-label={known ? '已掌握' : '标记为已掌握'}
      >
        <Check className="h-3 w-3" />
      </button>
    </Card>
  );
}
