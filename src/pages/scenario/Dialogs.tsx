import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DialogReader } from '@/components/feature/DialogReader';
import { EmptyState } from '@/components/feature/EmptyState';
import type { ScenarioData } from '@/types';

export function DialogsView({ data }: { data: ScenarioData }) {
  const [active, setActive] = useState(0);

  // 空态:data.dialogs 为空时给出友好提示 + 添加按钮
  if (data.dialogs.length === 0) {
    return (
      <EmptyState
        title="暂无对话"
        description="这个场景还没有整理对话数据。可以从单词/语法/小测学起,对话稍后补充。"
        scenarioId={data.meta.id}
      />
    );
  }

  const d = data.dialogs[active];

  return (
    <div className="grid md:grid-cols-[240px,1fr] gap-5">
      <div className="md:sticky md:top-20 self-start space-y-1.5 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-1">
        <div className="text-xs font-semibold text-muted-foreground px-1 mb-1.5">对话场景 ({data.dialogs.length})</div>
        {data.dialogs.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setActive(i)}
            className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
              i === active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <div className="font-medium">{it.title}</div>
            <div className={`text-xs ${i === active ? 'text-primary-foreground/80' : 'text-muted-foreground'} line-clamp-2`}>
              {it.scene}
            </div>
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {d ? (
          <>
            <DialogReader dialog={d} />
            <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" disabled={active === 0} onClick={() => setActive((v) => v - 1)}>
                ← 上一段
              </Button>
              <Button variant="ghost" size="sm" disabled={active === data.dialogs.length - 1} onClick={() => setActive((v) => v + 1)}>
                下一段 →
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="对话数据格式异常"
            description={`第 ${active + 1} 段对话缺失,请检查 dialogs.json 中 id=${data.dialogs[0]?.id ?? '?'} 的内容。`}
          />
        )}
      </div>
    </div>
  );
}
