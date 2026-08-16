import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, Volume1, Settings2, Sparkles, RotateCcw, Trophy, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import { speak, stopSpeak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { VerbData, VerbEntry, VerbFormDefinition, VerbForms, VerbType } from '@/types';

type Phase = 'config' | 'testing' | 'result';

const COUNT_OPTIONS = [10, 20, 30, 50, 0] as const; // 0 = 全部

const FORM_KEYS: { key: keyof VerbForms; label: string; needs: 'godan' | 'ichidan' | 'all' }[] = [
  { key: 'masu', label: 'ます形', needs: 'all' },
  { key: 'te', label: 'て形', needs: 'all' },
  { key: 'ta', label: 'た形(过去)', needs: 'all' },
  { key: 'nai', label: 'ない形(否定)', needs: 'all' },
  { key: 'potential', label: '可能形', needs: 'all' },
  { key: 'imperative', label: '命令形', needs: 'all' },
  { key: 'volitional', label: '意志形', needs: 'all' },
  { key: 'ba', label: 'ば形(假定)', needs: 'all' },
  { key: 'passive', label: '被动形', needs: 'all' },
  { key: 'causative', label: '使役形', needs: 'all' },
  { key: 'causative-passive', label: '使役被动', needs: 'all' },
  { key: 'prohibition', label: '禁止形', needs: 'all' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWrongForms(verb: VerbEntry, formKey: keyof VerbForms, all: VerbEntry[]): string[] {
  const correct = verb.forms[formKey];
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const j = all[Math.floor(Math.random() * all.length)];
    if (j.id === verb.id) continue;
    const v = j.forms[formKey];
    if (v && v !== correct && !wrongs.has(v)) wrongs.add(v);
  }
  return [...wrongs];
}

interface Question {
  verb: VerbEntry;
  formKey: keyof VerbForms;
  formLabel: string;
  options?: string[]; // choice 题
  answerIndex?: number;
  answer?: string; // spelling 题
}

function buildQuestions(
  verbs: VerbEntry[],
  enabledFormKeys: (keyof VerbForms)[],
  total: number,
): Question[] {
  const all: Question[] = [];
  for (const v of verbs) {
    for (const fk of enabledFormKeys) {
      const correct = v.forms[fk];
      if (!correct) continue;
      const formLabel = FORM_KEYS.find((x) => x.key === fk)?.label ?? fk;
      // 50% choice + 50% spelling
      if (Math.random() < 0.5) {
        const opts = shuffle([correct, ...pickWrongForms(v, fk, verbs)]);
        all.push({ verb: v, formKey: fk, formLabel, options: opts, answerIndex: opts.indexOf(correct) });
      } else {
        all.push({ verb: v, formKey: fk, formLabel, answer: correct });
      }
    }
  }
  return shuffle(all).slice(0, total);
}

export function VerbPractice() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // config
  const [count, setCount] = useState<number>(20);
  const [enabledFormKeys, setEnabledFormKeys] = useState<Set<keyof VerbForms>>(
    () => new Set(FORM_KEYS.map((f) => f.key)),
  );
  const [verbTypes, setVerbTypes] = useState<Set<VerbType>>(
    () => new Set<VerbType>(['godan', 'ichidan', 'kuru', 'suru']),
  );

  // testing
  const [phase, setPhase] = useState<Phase>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [typed, setTyped] = useState('');
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadVerbData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => () => stopSpeak(), []);

  // 打字题自动 focus
  useEffect(() => {
    if (phase === 'testing' && questions[idx]?.answer !== undefined) {
      inputRef.current?.focus();
    }
  }, [phase, idx, questions]);

  const filteredVerbs = useMemo(
    () => (data ? data.commonVerbs.filter((v) => verbTypes.has(v.type)) : []),
    [data, verbTypes],
  );

  if (error) {
    return <PageError message={`数据加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!data) return <PageLoader label="加载中…" />;

  function toggleForm(key: keyof VerbForms) {
    setEnabledFormKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleType(t: VerbType) {
    setVerbTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }
  function startTest() {
    const qs = buildQuestions(filteredVerbs, [...enabledFormKeys], count || filteredVerbs.length * enabledFormKeys.size);
    setQuestions(qs);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setTyped('');
    setAnswers([]);
    setPhase('testing');
  }
  function pickOption(i: number) {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    if (i === questions[idx].answerIndex) setScore((s) => s + 1);
    setAnswers((a) => [...a, i]);
  }
  function submitSpelling() {
    if (revealed || !typed.trim()) return;
    setRevealed(true);
    const correct = questions[idx].answer!;
    const norm = (s: string) => s.replace(/[\s\u3000]/g, '').toLowerCase();
    if (norm(typed) === norm(correct)) setScore((s) => s + 1);
    setAnswers((a) => [...a, typed]);
  }
  function next() {
    if (idx === questions.length - 1) {
      setPhase('result');
      onComplete?.(score);
      return;
    }
    setIdx((v) => v + 1);
    setPicked(null);
    setRevealed(false);
    setTyped('');
  }
  function restart() {
    setPhase('config');
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setTyped('');
    setQuestions([]);
  }
  function onComplete(score: number) { /* 暂时不存,以后可以存 best */ }

  // ============ CONFIG ============
  if (phase === 'config') {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
        <Link to="/verbs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回动词变形
        </Link>
        <Card>
          <CardContent className="p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">练习设置</h2>
            </div>

            {/* 动词类型 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">动词类型</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { key: 'godan', label: 'I 类(五段)' },
                  { key: 'ichidan', label: 'II 类(一段)' },
                  { key: 'kuru', label: 'III 类·来' },
                  { key: 'suru', label: 'III 类·する' },
                ] as { key: VerbType; label: string }[]).map((t) => {
                  const cnt = data.commonVerbs.filter((v) => v.type === t.key).length;
                  const enabled = verbTypes.has(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleType(t.key)}
                      className={cn(
                        'rounded-md border p-2.5 text-left text-sm transition-all flex items-center gap-2',
                        enabled ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border opacity-60',
                      )}
                    >
                      <div>
                        <div className="font-medium leading-tight">{t.label}</div>
                        <div className="text-[11px] text-muted-foreground">{cnt} 词</div>
                      </div>
                      {enabled && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 变形类型 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">变形类型(多选)</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FORM_KEYS.map((f) => {
                  const enabled = enabledFormKeys.has(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => toggleForm(f.key)}
                      className={cn(
                        'rounded-md border p-2.5 text-left text-sm transition-all',
                        enabled ? 'border-primary bg-primary/5' : 'border-border opacity-60',
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 数量 */}
            <div className="space-y-2">
              <span className="text-sm font-medium">题目数量</span>
              <div className="flex flex-wrap gap-2">
                {COUNT_OPTIONS.map((c) => {
                  const enabled = c === 0 ? true : c <= filteredVerbs.length * enabledFormKeys.size;
                  const selected = count === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => enabled && setCount(c)}
                      disabled={!enabled}
                      className={cn(
                        'rounded-md border px-4 py-2 text-sm transition-all',
                        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent',
                        !enabled && 'opacity-40 cursor-not-allowed',
                      )}
                    >
                      {c === 0 ? '全部' : `${c} 题`}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={startTest} disabled={enabledFormKeys.size === 0 || verbTypes.size === 0} className="w-full md:w-auto md:px-8">
              <Sparkles className="h-4 w-4" /> 开始练习
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ RESULT ============
  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-4">
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-2xl font-bold mb-2">练习完成!</h2>
          <p className="text-muted-foreground mb-2">
            你答对了 <span className="text-2xl font-bold text-primary">{score}</span> / {questions.length} 题
          </p>
          <p className="text-3xl font-bold text-primary mb-4">{pct}%</p>
          <Progress value={pct} className="mb-6 max-w-xs mx-auto" />
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={restart}>
              <Settings2 className="h-4 w-4" /> 重新设置
            </Button>
            <Button onClick={startTest}>
              <RotateCcw className="h-4 w-4" /> 再来一组
            </Button>
          </div>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3">题目回顾</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questions.map((q, i) => {
                const ans = answers[i];
                const correctChoice = q.answerIndex !== undefined && typeof ans === 'number' && ans === q.answerIndex;
                const correctSpelling = q.answer !== undefined && typeof ans === 'string' && q.answer.toLowerCase() === ans.trim().toLowerCase();
                const isCorrect = correctChoice || correctSpelling;
                return (
                  <div key={i} className={cn(
                    'flex items-start gap-2 p-2 rounded text-sm',
                    isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-destructive/10',
                  )}>
                    {isCorrect ? <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> : <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">
                        {i + 1}. [{q.formLabel}] {q.verb.dictionary}({q.verb.reading}) = {q.verb.meaning}
                      </div>
                      <div className="text-xs mt-0.5">
                        正确答案: <strong className="font-mono">{q.options ? q.options[q.answerIndex!] : q.answer}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ TESTING ============
  const q = questions[idx];
  if (!q) return null;
  const isSpelling = q.answer !== undefined;
  const isCorrectChoice = !isSpelling && picked !== null && picked === q.answerIndex;
  const isCorrectSpelling = isSpelling && revealed && (q.answer ?? '').toLowerCase() === typed.trim().toLowerCase();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>第 {idx + 1} 题 / 共 {questions.length} 题</span>
          <span>已答对 {score} 题</span>
        </div>
        <Progress value={((idx + 1) / questions.length) * 100} className="mt-2" />
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 px-2.5 py-0.5 text-[11px] font-medium">
              {q.formLabel}
            </span>
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Settings2 className="h-3 w-3" /> 改设置
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            请将 <span className="text-pink-600 dark:text-pink-400 font-mono font-medium">{q.verb.dictionary}</span>({q.verb.reading}) 变成 <strong>{q.formLabel}</strong>:
          </p>

          {!isSpelling ? (
            <div className="space-y-2">
              {q.options!.map((opt, i) => {
                const isPicked = picked === i;
                const isCorrect = i === q.answerIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => pickOption(i)}
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
          ) : (
            <>
              <form
                onSubmit={(e) => { e.preventDefault(); submitSpelling(); }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="输入假名…例如:かきました"
                  className="flex-1"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Button type="submit" disabled={!typed.trim()}>提交</Button>
              </form>
              {revealed && (
                <div className={cn(
                  'mt-3 rounded-md p-3 text-sm flex items-start gap-2',
                  isCorrectSpelling ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'bg-destructive/10 text-destructive',
                )}>
                  {isCorrectSpelling ? <Check className="h-4 w-4 mt-0.5" /> : <X className="h-4 w-4 mt-0.5" />}
                  <div>
                    <div>你的答案: <strong>{typed || '(空)'}</strong></div>
                    {!isCorrectSpelling && <div>正确答案: <strong>{q.answer}</strong></div>}
                  </div>
                </div>
              )}
            </>
          )}

          {revealed && (
            <div className="mt-4 flex justify-end">
              <Button onClick={next}>
                {idx === questions.length - 1 ? '查看成绩' : '下一题 →'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
