import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, X, Volume2, Sparkles, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { VerbData, VerbFormDefinition } from '@/types';

export function VerbForms() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    loadVerbData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  // 处理 #hash 滚动定位
  useEffect(() => {
    if (data && location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSelectedId(id);
    }
  }, [data, location.hash]);

  const selected = useMemo<VerbFormDefinition | null>(
    () => (data && selectedId ? data.forms.find((f) => f.id === selectedId) ?? null : null),
    [data, selectedId],
  );

  if (error) {
    return <PageError message={`数据加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!data) return <PageLoader label="加载中…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <Link to="/verbs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回动词变形
      </Link>

      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
        <div className="flex items-center justify-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>动词形态变化</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          掌握各种动词变化形式,灵活运用于不同语境
        </p>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {data.forms.map((f) => (
          <button
            key={f.id}
            id={f.id}
            onClick={() => setSelectedId(f.id)}
            className={cn(
              'group block text-left transition-all',
            )}
          >
            <Card className={cn(
              'p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full',
              selectedId === f.id && 'ring-2 ring-primary',
            )}>
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center text-white text-base mb-2`}>
                {f.emoji}
              </div>
              <div className="text-sm font-semibold leading-tight mb-0.5">{f.name}</div>
              <div className="text-[10px] text-muted-foreground line-clamp-1">{f.summary}</div>
              <div className="text-[10px] text-pink-600 dark:text-pink-400 mt-1.5">点击查看详细规则</div>
            </Card>
          </button>
        ))}
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className={`h-8 w-8 rounded-md bg-gradient-to-br ${selected.color} flex items-center justify-center text-white text-sm`}>
                  {selected.emoji}
                </span>
                {selected.name}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{selected.summary}</p>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-pink-600 dark:text-pink-400 mb-1">构成规则:</div>
              {selected.rules.map((r, i) => (
                <div key={i} className="rounded-md bg-muted/40 px-3 py-2 text-sm font-mono whitespace-pre-wrap">
                  {r}
                </div>
              ))}

              {selected.tips.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 mt-3">⚡ 常见派生 / 小贴士:</div>
                  {selected.tips.map((t, i) => (
                    <div key={i} className="rounded-md bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                      {t}
                    </div>
                  ))}
                </>
              )}

              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 mt-3">📗 示例:</div>
              {selected.examples.map((ex, i) => (
                <div key={i} className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speak(ex.conjugation, { rate: 0.85 }).catch(() => {})}
                      className="text-pink-600 dark:text-pink-400 font-mono text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      {ex.conjugation}
                    </button>
                    <span className="text-xs text-muted-foreground">({ex.word})</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ex.translation}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
