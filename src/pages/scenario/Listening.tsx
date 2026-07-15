import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ListeningPlayer } from '@/components/feature/ListeningPlayer';
import type { ScenarioData } from '@/types';

export function ListeningView({ data }: { data: ScenarioData }) {
  const [idx, setIdx] = useState(0);
  const item = data.listening[idx];
  if (!item) return null;
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <span>进度</span>
          <span>{idx + 1} / {data.listening.length}</span>
        </div>
        <Progress value={((idx + 1) / data.listening.length) * 100} />
      </Card>
      <ListeningPlayer
        item={item}
        index={idx}
        total={data.listening.length}
        onNext={() => setIdx((v) => Math.min(v + 1, data.listening.length - 1))}
      />
      <div className="flex justify-between">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          disabled={idx === 0}
          onClick={() => setIdx((v) => Math.max(0, v - 1))}
        >
          ← 上一题
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
          disabled={idx === data.listening.length - 1}
          onClick={() => setIdx((v) => Math.min(v + 1, data.listening.length - 1))}
        >
          下一题 →
        </button>
      </div>
    </div>
  );
}
