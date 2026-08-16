import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, X, BookOpen, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { VerbData, VerbBasicsCard } from '@/types';

export function VerbBasics() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<VerbBasicsCard | null>(null);

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
              {/* 右上角双按钮:查看详细 + 已掌握 */}
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => setDetail(card)}
                  className="text-[10px] rounded-md px-2 py-1 bg-pink-500/15 text-pink-700 dark:text-pink-300 hover:bg-pink-500/30 transition-all"
                  title="查看详细规则"
                >
                  📖 查看详细
                </button>
                <button
                  onClick={() => toggleMark(card.id)}
                  className={cn(
                    'text-[10px] rounded-md px-2 py-1 transition-all flex items-center gap-0.5',
                    done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-emerald-500/20',
                  )}
                  title={done ? '已掌握(点击取消)' : '标记为已掌握'}
                >
                  {done ? <><Check className="h-3 w-3" />已掌握</> : '标记掌握'}
                </button>
              </div>
              <h3 className="text-base font-semibold pr-32">{card.title}</h3>
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

      {/* 详情弹窗 */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-pink-500" />
                {detail.title} · 详细规则
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setDetail(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{detail.summary}</p>

            <div className="rounded-md bg-rose-50 dark:bg-rose-950/20 p-3 text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {detail.details?.join('\n') ?? '暂无详细说明'}
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-right">
              {marked.has(detail.id) ? '✓ 你已标记为已掌握' : '记得点右上角"标记掌握"记录进度'}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
