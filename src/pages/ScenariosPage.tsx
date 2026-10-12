import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Car, HeartPulse, Home, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadScenarioMetas } from '@/lib/loader';
import { getProgress } from '@/lib/storage';
import type { ScenarioCategory, ScenarioMeta } from '@/types';
import { BookOpen, GraduationCap, MessageCircle, Headphones, ClipboardCheck } from 'lucide-react';

interface CategoryDef {
  key: ScenarioCategory;
  title: string;
  subtitle: string;
  icon: typeof Car;
  // tailwind 渐变 class(用于小标题的图标底色)
  color: string;
}

const CATEGORY_ORDER: CategoryDef[] = [
  {
    key: 'driving',
    title: '学车驾考',
    subtitle: '从入校到卒检的整套流程,一句话不漏',
    icon: Car,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    key: 'medical',
    title: '看病就医',
    subtitle: '医院、产科、诊所、药房——用日语不慌',
    icon: HeartPulse,
    color: 'from-pink-500 to-rose-500',
  },
  {
    key: 'life',
    title: '日常生活',
    subtitle: '银行、役所、租房、办手续——让生活更顺手',
    icon: Home,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'exam',
    title: '日语考试',
    subtitle: 'N5 / N4 备考、标准教材系统学习',
    icon: GraduationCap,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    key: 'other',
    title: '其他',
    subtitle: '工作 / 兴趣 / 其他实用场景',
    icon: Sparkles,
    color: 'from-slate-500 to-zinc-500',
  },
];

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

  // 按 category 分组
  const grouped = useMemo(() => {
    if (!metas) return new Map<ScenarioCategory, ScenarioMeta[]>();
    const m = new Map<ScenarioCategory, ScenarioMeta[]>();
    for (const meta of metas) {
      const cat = meta.category || 'other';
      const arr = m.get(cat) ?? [];
      arr.push(meta);
      m.set(cat, arr);
    }
    return m;
  }, [metas]);

  if (error) {
    return <PageError message={`场景列表加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!metas) return <PageLoader label="加载场景列表…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">学习场景</h1>
        <p className="text-sm text-muted-foreground mt-1">选择你正在或即将面对的场景,逐个击破</p>
      </div>

      {metas.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">暂无场景</Card>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat.key);
            if (!items || items.length === 0) return null;
            const Icon = cat.icon;
            return (
              <section key={cat.key} className="space-y-3">
                {/* 小标题 */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-sm`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold leading-tight">
                      {cat.title}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {items.length} 个场景
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                  </div>
                </div>

                {/* 卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((meta) => {
                    const progress = getProgress(meta.id);
                    return (
                      <Link
                        key={meta.id}
                        to={`/scenarios/${meta.id}`}
                        className="group block"
                      >
                        <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/50">
                          <div
                            className={`h-24 bg-gradient-to-br ${meta.color} flex items-center justify-center text-5xl`}
                          >
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
                              <p className="text-[11px] text-primary/80">
                                已学进度 · 小测最佳 {progress.quizBest ?? 0}
                              </p>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
