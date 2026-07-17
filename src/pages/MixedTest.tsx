import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadScenarioMetas, loadScenario } from '@/lib/loader';
import { setProgress } from '@/lib/storage';
import { cn } from '@/lib/cn';
import type { QuizQuestion, ScenarioMeta } from '@/types';
import { Check, X, RotateCcw, Trophy, ChevronLeft, ChevronRight, Sparkles, ListChecks } from 'lucide-react';

type Phase = 'config' | 'testing' | 'result';

const COUNT_OPTIONS = [10, 20, 50, 100, 200] as const;

interface TaggedQuestion extends QuizQuestion {
  scenarioId: string;
  scenarioTitle: string;
  scenarioEmoji: string;
}

export function MixedTest() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('config');

  // 配置阶段
  const [metas, setMetas] = useState<ScenarioMeta[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState<number>(20);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // 测试 / 结果阶段
  const [questions, setQuestions] = useState<TaggedQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  // 加载场景清单
  useEffect(() => {
    let cancelled = false;
    loadScenarioMetas()
      .then((m) => {
        if (cancelled) return;
        setMetas(m);
        setSelected(new Set(m.map((x) => x.id))); // 默认全选
      })
      .catch((e) => { if (!cancelled) setLoadErr(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  const totalAvailable = useMemo(() => {
    if (!metas) return 0;
    // 估算可选题数 = 所选场景的 quiz 长度之和
    // 我们不知道准确的题数,只能在配置阶段让用户先看到 "按 20 题准备" 这种提示
    return null;
  }, [metas, selected]);

  function toggleScenario(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!metas) return;
    setSelected(new Set(metas.map((m) => m.id)));
  }
  function clearAll() {
    setSelected(new Set());
  }

  // 开始测试
  async function startTest() {
    if (!metas || selected.size === 0) return;
    setLoadingQuestions(true);
    try {
      const ids = Array.from(selected);
      const metaById = new Map(metas.map((m) => [m.id, m]));
      const scenarios = await Promise.all(ids.map((id) => loadScenario(id)));
      const pool: TaggedQuestion[] = [];
      for (const sc of scenarios) {
        if (!sc) continue;
        const meta = metaById.get(sc.meta.id)!;
        for (const q of sc.quiz) {
          // 综合测试只支持带 options 的题型(choice/truefalse/response/listening)
          // spelling/spell-audio 需要输入框,综合测试里不混入
          if (!q.options || q.options.length < 2) continue;
          pool.push({
            ...q,
            scenarioId: sc.meta.id,
            scenarioTitle: meta.title,
            scenarioEmoji: meta.emoji,
          });
        }
      }
      // 洗牌
      const shuffled = pool
        .map((q) => ({ q, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map((x) => x.q);
      const sliced = shuffled.slice(0, Math.min(count, shuffled.length));
      setQuestions(sliced);
      setIdx(0);
      setPicked(null);
      setRevealed(false);
      setAnswers([]);
      setPhase('testing');
    } catch (e) {
      setLoadErr((e as Error)?.message ?? String(e));
    } finally {
      setLoadingQuestions(false);
    }
  }

  function pick(i: number) {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    setAnswers((a) => {
      const next = [...a];
      next[idx] = i;
      return next;
    });
  }

  function next() {
    if (idx >= questions.length - 1) {
      // 提交
      setPhase('result');
      return;
    }
    setIdx((v) => v + 1);
    setPicked(answers[idx + 1] ?? null);
    setRevealed(answers[idx + 1] != null);
  }

  function prev() {
    if (idx <= 0) return;
    setIdx((v) => v - 1);
    setPicked(answers[idx - 1] ?? null);
    setRevealed(answers[idx - 1] != null);
  }

  function restart() {
    setPhase('config');
    setQuestions([]);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setAnswers([]);
  }

  // ============== 渲染 ==============

  if (loadErr) {
    return (
      <PageError
        message={`场景加载失败:${loadErr}`}
        onRetry={() => { setLoadErr(null); setRetryKey((k) => k + 1); }}
      />
    );
  }

  if (phase === 'config') {
    if (!metas) return <PageLoader label="加载场景列表…" />;

    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4" />
            <span>多场景综合测试</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">综合测试</h1>
          <p className="text-sm text-muted-foreground mt-1">
            勾选要测试的场景,选好题量,一口气刷完。
          </p>
        </div>

        {/* 场景选择 */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">① 选择场景</h2>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-primary hover:underline">全选</button>
                <span className="text-muted-foreground">·</span>
                <button onClick={clearAll} className="text-muted-foreground hover:underline">清空</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {metas.map((m) => {
                const checked = selected.has(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleScenario(m.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-md border p-3 text-left transition-all',
                      checked ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                    )}
                  >
                    <div className={cn(
                      'h-5 w-5 rounded border flex items-center justify-center shrink-0',
                      checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40',
                    )}>
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`h-9 w-9 rounded bg-gradient-to-br ${m.color} flex items-center justify-center text-lg shrink-0`}>
                      {m.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              已选 {selected.size} / {metas.length} 个场景
            </p>
          </CardContent>
        </Card>

        {/* 题量 */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-semibold">② 选择题量</h2>
            <div className="flex flex-wrap gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    'px-4 py-2 rounded-md border text-sm transition-all min-w-[64px]',
                    count === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {n} 题
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              题库从所选场景的题库中随机抽取,题量大于题库时取全部。
            </p>
          </CardContent>
        </Card>

        {/* 开始 */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/scenarios')}>
            ← 返回场景
          </Button>
          <Button
            size="lg"
            disabled={selected.size === 0 || loadingQuestions}
            onClick={startTest}
          >
            <ListChecks className="h-4 w-4" />
            {loadingQuestions ? '准备题库…' : `开始测试 · ${count} 题`}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'testing') {
    const q = questions[idx];
    if (!q) return <PageLoader label="加载题目…" />;
    const progressPct = ((idx + 1) / questions.length) * 100;
    const correctCount = answers.reduce((acc, a, i) => {
      if (a == null) return acc;
      return acc + (a === questions[i].answerIndex ? 1 : 0);
    }, 0);

    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>第 {idx + 1} / {questions.length} 题</span>
            <span>已答对 {correctCount} 题</span>
          </div>
          <Progress value={progressPct} className="mt-2" />
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-[10px]">
                {q.scenarioEmoji} {q.scenarioTitle}
              </Badge>
            </div>
            <p className="text-base font-medium mb-4 leading-relaxed">{q.question}</p>
            <div className="space-y-2">
              {(q.options ?? []).map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = i === q.answerIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => pick(i)}
                    className={cn(
                      'w-full text-left rounded-md border p-3 text-sm transition-all',
                      !revealed && 'hover:bg-accent',
                      revealed && isCorrect && 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
                      revealed && isPicked && !isCorrect && 'border-destructive bg-destructive/10',
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {revealed && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                      {revealed && isPicked && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                      {String.fromCharCode(65 + i)}. {opt}
                    </span>
                  </button>
                );
              })}
            </div>
            {revealed && q.explanation && (
              <div className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
                💡 {q.explanation}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={prev} disabled={idx === 0}>
                <ChevronLeft className="h-4 w-4" /> 上一题
              </Button>
              <Button
                size="sm"
                onClick={next}
                disabled={!revealed}
              >
                {idx === questions.length - 1 ? '提交并查看成绩' : '下一题'} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // result
  const finalScore = answers.reduce((acc, a, i) => {
    if (a == null) return acc;
    return acc + (a === questions[i].answerIndex ? 1 : 0);
  }, 0);
  const pct = Math.round((finalScore / questions.length) * 100);

  // 保存最佳成绩(用每个场景的)
  // 因为综合测试可能跨多场景,这里存到本地一个独立 key
  try {
    const best = JSON.parse(localStorage.getItem('jpstudy:mixedTest:best') ?? '0') as { score: number; total: number; pct: number };
    if (pct > best.pct) {
      localStorage.setItem('jpstudy:mixedTest:best', JSON.stringify({ score: finalScore, total: questions.length, pct }));
    }
  } catch { /* ignore */ }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-4">
      <Card className="p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-2xl font-bold mb-2">综合测试完成!</h2>
        <p className="text-muted-foreground mb-2">
          你答对了 <span className="text-2xl font-bold text-primary">{finalScore}</span> / {questions.length} 题
        </p>
        <p className="text-3xl font-bold text-primary mb-4">{pct}%</p>
        <Progress value={pct} className="mb-6 max-w-xs mx-auto" />
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="h-4 w-4" /> 再来一次
          </Button>
          <Button onClick={() => navigate('/scenarios')}>
            返回场景
          </Button>
        </div>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">错题回顾 ({questions.length - finalScore} 题)</h3>
          {(() => {
            const wrongs = questions
              .map((q, i) => ({ q, i, picked: answers[i] }))
              .filter(({ q, picked }) => picked != null && picked !== q.answerIndex);
            if (wrongs.length === 0) {
              return <p className="text-sm text-emerald-600">🎉 全部答对,太强了!</p>;
            }
            return (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {wrongs.map(({ q, i }) => (
                  <div key={q.id} className="rounded-md bg-destructive/10 p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="secondary" className="text-[10px]">{q.scenarioEmoji} {q.scenarioTitle}</Badge>
                      <span className="text-xs text-muted-foreground">第 {i + 1} 题</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{q.question}</p>
                    <p className="text-xs">
                      <X className="inline h-3 w-3 text-destructive" /> 你的答案: <span className="text-destructive">{(q.options ?? [])[answers[i]!] ?? '—'}</span>
                    </p>
                    <p className="text-xs mt-0.5">
                      <Check className="inline h-3 w-3 text-emerald-600" /> 正确答案: <strong>{(q.options ?? [])[q.answerIndex ?? 0]}</strong>
                    </p>
                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground mt-1">💡 {q.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
