import { useState } from 'react';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { KanaCell as KanaCellType } from '@/types';

interface Props {
  cell: KanaCellType;
  highlight?: 'hiragana' | 'katakana' | 'both';
}

export function KanaCell({ cell, highlight = 'both' }: Props) {
  const [showRomaji, setShowRomaji] = useState(false);
  if (!cell.hiragana) {
    return <div className="aspect-square" />;
  }
  return (
    <button
      type="button"
      onClick={() => {
        setShowRomaji((v) => !v);
        speak(cell.romaji, { rate: 0.7 });
      }}
      className={cn(
        'group relative aspect-square rounded-md border bg-card hover:bg-accent/40 transition-colors',
        'flex flex-col items-center justify-center p-1 sm:p-2 cursor-pointer select-none',
      )}
      title={`${cell.hiragana} / ${cell.katakana} - ${cell.romaji}`}
    >
      <span
        className={cn(
          'jp font-medium leading-none',
          'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
          highlight === 'katakana' && 'opacity-30',
        )}
      >
        {cell.hiragana}
      </span>
      <span
        className={cn(
          'jp text-muted-foreground mt-0.5 leading-none',
          'text-sm sm:text-base md:text-lg',
          highlight === 'hiragana' && 'opacity-30',
        )}
      >
        {cell.katakana}
      </span>
      {showRomaji && (
        <span className="absolute -top-1 right-1 text-[10px] text-primary font-mono bg-background/90 rounded px-1">
          {cell.romaji}
        </span>
      )}
    </button>
  );
}
