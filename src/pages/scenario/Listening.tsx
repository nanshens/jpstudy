import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ListeningPlayer } from '@/components/feature/ListeningPlayer';
import { EmptyState } from '@/components/feature/EmptyState';
import type { ScenarioData } from '@/types';

export function ListeningView({ data }: { data: ScenarioData }) {
  const [idx, setIdx] = useState(0);

  // 空态:data.listening 为空时给出友好提示
  if (data.listening.length === 0) {
    return (
      <EmptyState
        title="暂无听力"
        description="这个场景还没有整理听力数据。可以从单词/语法/小测学起,听力稍后补充。"
        scenarioId={data.meta.id}
      />
    );
  }

  const item = data.listening[idx];
  if (!item) {
    return (
      <EmptyState
        title="听力数据异常"
        description={`第 ${idx + 1} 题缺失,请检查 listening.json。`}
      />
    );
  }

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
