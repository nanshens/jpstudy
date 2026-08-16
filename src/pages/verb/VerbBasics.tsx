import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { VerbData } from '@/types';

export function VerbBasics() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    loadVerbData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    try {
      const saved = JSON.parse(localStorage.getItem('jpstudy:verb:basics:marked') ?? '[]');
      if (Array.isArray(saved)) setMarked(new Set(saved));
    } catch { /* noop */ }
    return () => { cancelled = true; };
  }, [retryKey]);

  function toggleMark(id: string) {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('jpstudy:verb:basics:marked', JSON.stringify([...next]));
      } catch { /* noop */ }
      return next;
    });
  }

  if (error) {
    return <PageError message={`数据加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!data) return <PageLoader label="加载中…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <Link to="/verbs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回动词变形
      </Link>

      <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-pink-200/50">
        <div className="flex items-center justify-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-pink-500" />
          <span>基础概念掌握</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          掌握日语动词的核心概念，为后续学习打下坚实基础
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.basics.map((card) => {
          const done = marked.has(card.id);
          return (
            <Card key={card.id} className="p-5 space-y-3 relative hover:shadow-md transition-all">
              <button
                onClick={() => toggleMark(card.id)}
                className={cn(
                  'absolute top-3 right-3 text-xs rounded-md px-2 py-1 transition-all',
                  done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-emerald-500/20',
                )}
                title={done ? '已掌握(点击取消)' : '标记为已掌握'}
              >
                {done ? '✓ 已掌握' : '点击查看详细规则'}
              </button>
              <h3 className="text-base font-semibold pr-20">{card.title}</h3>
              <p className="text-xs text-muted-foreground">{card.summary}</p>

              <div className="space-y-2 pt-1">
                {card.items.map((item, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-pink-600 dark:text-pink-400 font-medium">{item.term}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </div>
                    {item.example && (
                      <button
                        onClick={() => speak(item.example, { rate: 0.85 }).catch(() => {})}
                        className="text-xs text-muted-foreground/80 hover:text-primary font-mono mt-0.5"
                      >
                        {item.example}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {card.conjugation && (
                <div className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-foreground/80">
                  <span className="text-pink-600 dark:text-pink-400 font-medium">变形:</span> {card.conjugation}
                </div>
              )}

              {card.tip && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-200">
                  💡 {card.tip}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
