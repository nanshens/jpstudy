import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadScenarioMetas } from '@/lib/loader';
import { getProgress } from '@/lib/storage';
import type { ScenarioMeta } from '@/types';
import { BookOpen, GraduationCap, MessageCircle, Headphones, ClipboardCheck } from 'lucide-react';

export function ScenariosPage() {
  const [metas, setMetas] = useState<ScenarioMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadScenarioMetas()
      .then((m) => { if (!cancelled) setMetas(m); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  if (error) {
    return <PageError message={`场景列表加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!metas) return <PageLoader label="加载场景列表…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">学习场景</h1>
        <p className="text-sm text-muted-foreground mt-1">选择你正在或即将面对的场景,逐个击破</p>
      </div>

      {metas.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">暂无场景</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metas.map((meta) => {
            const progress = getProgress(meta.id);
            return (
              <Link
                key={meta.id}
                to={`/scenarios/${meta.id}`}
                className="group block"
              >
                <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/50">
                  <div className={`h-24 bg-gradient-to-br ${meta.color} flex items-center justify-center text-5xl`}>
                    {meta.emoji}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{meta.title}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{meta.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        <BookOpen className="h-2.5 w-2.5 mr-0.5" /> 单词
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <GraduationCap className="h-2.5 w-2.5 mr-0.5" /> 语法
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <MessageCircle className="h-2.5 w-2.5 mr-0.5" /> 对话
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <Headphones className="h-2.5 w-2.5 mr-0.5" /> 听力
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        <ClipboardCheck className="h-2.5 w-2.5 mr-0.5" /> 小测
                      </Badge>
                    </div>
                    {progress.visitedTabs.length > 0 && (
                      <p className="text-[11px] text-primary/80">已学进度 · 小测最佳 {progress.quizBest ?? 0}</p>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
