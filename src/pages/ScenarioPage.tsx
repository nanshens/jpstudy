import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, MessageCircle, Headphones, ClipboardCheck, House } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { loadScenario } from '@/lib/loader';
import { setProgress } from '@/lib/storage';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { Overview } from './scenario/Overview';
import { WordsView } from './scenario/Words';
import { GrammarView } from './scenario/Grammar';
import { DialogsView } from './scenario/Dialogs';
import { ListeningView } from './scenario/Listening';
import { QuizView } from './scenario/Quiz';
import type { ScenarioData } from '@/types';

const TAB_KEYS = ['overview', 'words', 'grammar', 'dialogs', 'listening', 'quiz'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export function ScenarioPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ScenarioData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [tab, setTab] = useState<TabKey>('overview');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setData(null);
    setError(null);
    setNotFound(false);
    loadScenario(id)
      .then((d) => {
        if (cancelled) return;
        if (!d) setNotFound(true);
        else {
          setData(d);
          setProgress(d.meta.id, {});
        }
      })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [id, retryKey]);

  if (error) {
    return <PageError message={`场景加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 text-center space-y-3">
        <p className="text-muted-foreground">找不到场景:<code className="px-1 bg-muted rounded">{id}</code></p>
        <Link to="/scenarios" className="text-sm text-primary underline">返回场景列表</Link>
      </div>
    );
  }
  if (!data) return <PageLoader label="加载场景数据…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>

      {/* Hero */}
      <div className={`rounded-xl p-5 md:p-7 bg-gradient-to-br ${data.meta.color} text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl md:text-4xl">{data.meta.emoji}</span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{data.meta.title}</h1>
            <p className="text-sm text-white/80">{data.meta.subtitle}</p>
          </div>
        </div>
        <p className="text-sm md:text-base text-white/90 max-w-3xl leading-relaxed">{data.meta.description}</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max md:w-auto">
            <TabsTrigger value="overview" icon={<House className="h-3.5 w-3.5" />}>概览</TabsTrigger>
            <TabsTrigger value="words" icon={<BookOpen className="h-3.5 w-3.5" />}>单词</TabsTrigger>
            <TabsTrigger value="grammar" icon={<GraduationCap className="h-3.5 w-3.5" />}>语法</TabsTrigger>
            <TabsTrigger value="dialogs" icon={<MessageCircle className="h-3.5 w-3.5" />}>对话</TabsTrigger>
            <TabsTrigger value="listening" icon={<Headphones className="h-3.5 w-3.5" />}>听力</TabsTrigger>
            <TabsTrigger value="quiz" icon={<ClipboardCheck className="h-3.5 w-3.5" />}>小测</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <Overview data={data} />
        </TabsContent>
        <TabsContent value="words">
          <WordsView data={data} />
        </TabsContent>
        <TabsContent value="grammar">
          <GrammarView data={data} />
        </TabsContent>
        <TabsContent value="dialogs">
          <DialogsView data={data} />
        </TabsContent>
        <TabsContent value="listening">
          <ListeningView data={data} />
        </TabsContent>
        <TabsContent value="quiz">
          <QuizView data={data} onComplete={(score) => setProgress(data.meta.id, { quizBest: score })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
