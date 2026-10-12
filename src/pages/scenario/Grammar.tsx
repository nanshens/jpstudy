import { useState } from 'react';
import { Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpeakButton } from '@/components/feature/SpeakButton';
import { speak } from '@/lib/speech';
import type { ScenarioData } from '@/types';

export function GrammarView({ data }: { data: ScenarioData }) {
  const [active, setActive] = useState(0);
  const g = data.grammar[active];

  // 空态:场景无语法数据 (例如 numbers 场景)
  if (data.grammar.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground text-sm">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="font-medium text-foreground mb-1">暂无语法</p>
        <p>这个场景还没整理语法点。先从单词/打字/小测学起,语法稍后补充。</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-[260px,1fr] gap-5">
      {/* 左侧列表 */}
      <div className="md:sticky md:top-20 self-start space-y-1.5 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-1">
        <div className="text-xs font-semibold text-muted-foreground px-1 mb-1.5">语法点 ({data.grammar.length})</div>
        {data.grammar.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setActive(i)}
            className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
              i === active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <div className="font-medium truncate">{it.title}</div>
            <div className={`text-xs ${i === active ? 'text-primary-foreground/80' : 'text-muted-foreground'} jp truncate`}>
              {it.pattern}
            </div>
          </button>
        ))}
      </div>

      {/* 右侧详情 */}
      <div className="space-y-4 animate-fade-in">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {g.title}
                </Badge>
                <CardTitle className="jp text-2xl">{g.pattern}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1.5">{g.meaning}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => speak(g.pattern, { rate: 0.7 })}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3.5 text-sm leading-relaxed">
              {g.explanation}
            </div>

            <div>
              <div className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                例句
              </div>
              <div className="space-y-2">
                {g.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-md border bg-card p-3 text-sm hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-2 flex-1 min-w-0">
                        <span className="jp font-medium text-base">{ex.jp}</span>
                        <span className="jp text-xs text-muted-foreground truncate">{ex.reading}</span>
                      </div>
                      <SpeakButton text={ex.jp} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{ex.meaning}</div>
                  </div>
                ))}
              </div>
            </div>

            {g.note && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 p-3 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{g.note}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 上下导航 */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={active === 0}
            onClick={() => setActive((v) => Math.max(0, v - 1))}
          >
            ← 上一条
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={active === data.grammar.length - 1}
            onClick={() => setActive((v) => Math.min(data.grammar.length - 1, v + 1))}
          >
            下一条 →
          </Button>
        </div>
      </div>
    </div>
  );
}
