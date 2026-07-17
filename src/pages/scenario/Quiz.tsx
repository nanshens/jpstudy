import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Check, X, RotateCcw, Trophy, Volume2, Headphones, Pencil, MessageSquare, Sparkles, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { speak, stopSpeak } from '@/lib/speech';
import type { QuizQuestion, QuizType, ScenarioData } from '@/types';

interface Props {
  data: ScenarioData;
  onComplete?: (score: number) => void;
}

type Phase = 'config' | 'testing' | 'result';
const COUNT_OPTIONS = [10, 20, 30, 50, 0] as const; // 0 = 全部

/** 根据题目字段推断类型(向后兼容老数据) */
function inferType(q: QuizQuestion): QuizType {
  if (q.type) return q.type;
  if (q.answer && !q.options) return q.audio ? 'spell-audio' : 'spelling';
  if (q.audio) return 'listening';
  if ((q.options?.length ?? 0) === 2) return 'truefalse';
  return 'choice';
}

const TYPE_META: Record<QuizType, { label: string; color: string; icon: typeof Headphones }> = {
  choice: { label: '选择题', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300', icon: Pencil },
  truefalse: { label: '真假判断', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', icon: Check },
  response: { label: '听力回答', color: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300', icon: MessageSquare },
  spelling: { label: '拼写测试', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', icon: Pencil },
  listening: { label: '听力选择', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300', icon: Headphones },
  'spell-audio': { label: '听力拼写', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', icon: Headphones },
};

const TYPE_ORDER: QuizType[] = ['choice', 'truefalse', 'listening', 'response', 'spelling', 'spell-audio'];

/** 洗牌 - Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizView({ data, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('config');
  // 配置
  const [count, setCount] = useState<number>(0); // 0 = 全部
  const [enabledTypes, setEnabledTypes] = useState<Set<QuizType>>(
    () => new Set(TYPE_ORDER),
  );

  // 实际抽题(洗牌后)
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // 测试状态
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  /** 每题作答结果 */
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);

  // 题库按类型分组
  const byType = useMemo(() => {
    const m: Partial<Record<QuizType, QuizQuestion[]>> = {};
    for (const q of data.quiz) {
      const t = inferType(q);
      (m[t] ??= []).push(q);
    }
    return m;
  }, [data.quiz]);
  const availableTypes = useMemo(() => TYPE_ORDER.filter((t) => (byType[t]?.length ?? 0) > 0), [byType]);
  const typeCounts = useMemo(() => Object.fromEntries(availableTypes.map((t) => [t, byType[t]?.length ?? 0])), [byType, availableTypes]);

  const q = questions[idx];
  const type = q ? inferType(q) : 'choice';

  // 切题/卸载时停 TTS
  useEffect(() => {
    return () => stopSpeak();
  }, []);

  // 进入新题:自动播 audio
  useEffect(() => {
    if (!q || phase !== 'testing') return;
    if (q.audio && (type === 'listening' || type === 'response' || type === 'spell-audio')) {
      const t = setTimeout(() => {
        speak(q.audio!, { rate: 0.85 }).catch(() => {});
      }, 200);
      return () => clearTimeout(t);
    }
  }, [idx, q, type, phase]);

  function toggleType(t: QuizType) {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function startTest() {
    // 1) 收集所选题型 + 洗牌
    const pool: QuizQuestion[] = [];
    for (const t of availableTypes) {
      if (!enabledTypes.has(t)) continue;
      pool.push(...(byType[t] ?? []));
    }
    const shuffled = shuffle(pool);
    const sliced = count > 0 ? shuffled.slice(0, Math.min(count, shuffled.length)) : shuffled;
    setQuestions(sliced);
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    setPhase('testing');
  }

  function commitChoice(i: number) {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    const correct = i === q!.answerIndex;
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, i]);
  }

  function commitSpelling(typed: string) {
    if (revealed) return;
    setRevealed(true);
    const accepted = (q!.answer ?? '').split('|').map((s) => s.trim()).filter(Boolean);
    const norm = (s: string) => s.replace(/[\s\u3000]/g, '').toLowerCase();
    const correct = accepted.some((a) => norm(a) === norm(typed));
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, typed]);
  }

  function next() {
    if (idx === questions.length - 1) {
      setFinished();
      return;
    }
    setIdx((v) => v + 1);
    setPicked(null);
    setRevealed(false);
  }

  function setFinished() {
    setPhase('result');
    onComplete?.(score);
  }

  function restart() {
    setPhase('config');
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    setQuestions([]);
  }

  // ============ CONFIG 阶段 ============
  if (phase === 'config') {
    const totalAvailable = availableTypes.reduce((sum, t) => sum + (enabledTypes.has(t) ? (byType[t]?.length ?? 0) : 0), 0);
    const maxCount = totalAvailable;
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">小测设置</h2>
          </div>

          {/* 题型选择 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">选择题型</span>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set(availableTypes))}
                  className="text-primary hover:underline"
                >全选</button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setEnabledTypes(new Set())}
                  className="text-primary hover:underline"
                >清空</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableTypes.map((t) => {
                const m = TYPE_META[t];
                const Icon = m.icon;
                const enabled = enabledTypes.has(t);
                const cnt = typeCounts[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      'rounded-md border p-2.5 text-left text-sm transition-all flex items-center gap-2',
                      enabled
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:bg-accent opacity-60',
                    )}
                  >
                    <span className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md', m.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight">{m.label}</div>
                      <div className="text-[11px] text-muted-foreground">{cnt} 题</div>
                    </div>
                    {enabled && <Check className="h-4 w-4 text-primary" />}
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
                const enabled = c === 0 ? true : c <= maxCount;
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
            <p className="text-xs text-muted-foreground">
              已选题库共 <strong className="text-foreground">{totalAvailable}</strong> 题 · 每次随机抽取,顺序打乱
            </p>
          </div>

          <Button onClick={startTest} disabled={totalAvailable === 0} className="w-full md:w-auto md:px-8">
            <Sparkles className="h-4 w-4" /> 开始小测
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!q) return null;

  // ============ RESULT 阶段 ============
  if (phase === 'result') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-2xl font-bold mb-2">测试完成!</h2>
        <p className="text-muted-foreground mb-4">
          你答对了 <span className="text-2xl font-bold text-primary">{score}</span> / {questions.length} 题 ({pct}%)
        </p>
        <Progress value={pct} className="mb-6 max-w-xs mx-auto" />
        <div className="space-y-2 text-left max-w-md mx-auto mb-6 max-h-96 overflow-y-auto">
          {questions.map((qq, i) => {
            const t = inferType(qq);
            const isSpelling = t === 'spelling' || t === 'spell-audio';
            const ans = answers[i];
            const correctChoice = !isSpelling && typeof ans === 'number' && ans === qq.answerIndex;
            const correctSpelling = isSpelling && typeof ans === 'string' && (qq.answer ?? '').split('|').map((s) => s.trim().toLowerCase()).includes(ans.trim().toLowerCase());
            const isCorrect = correctChoice || correctSpelling;
            return (
              <div
                key={qq.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded text-sm',
                  isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-destructive/10',
                )}
              >
                {isCorrect ? (
                  <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{i + 1}.</span>
                    <TypeBadge type={t} />
                    <span className="truncate">{qq.question}</span>
                  </div>
                  {!isSpelling && qq.options && (
                    <div className="text-xs mt-0.5">
                      正确答案: <strong>{qq.options[qq.answerIndex ?? 0]}</strong>
                    </div>
                  )}
                  {isSpelling && qq.answer && (
                    <div className="text-xs mt-0.5">
                      正确答案: <strong>{qq.answer.split('|')[0]}</strong>
                    </div>
                  )}
                  {qq.explanation && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">{qq.explanation}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={restart}>
            <Settings2 className="h-4 w-4" /> 重新设置
          </Button>
          <Button onClick={startTest}>
            <RotateCcw className="h-4 w-4" /> 再来一组
          </Button>
        </div>
      </Card>
    );
  }

  // ============ TESTING 阶段 ============
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
          <div className="mb-4 flex items-center gap-2">
            <TypeBadge type={type} />
            <button
              type="button"
              onClick={() => setPhase('config')}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Settings2 className="h-3 w-3" /> 改设置
            </button>
          </div>
          {type === 'spelling' && <SpellingQuestion q={q} revealed={revealed} onSubmit={commitSpelling} />}
          {type === 'spell-audio' && <SpellAudioQuestion q={q} revealed={revealed} onSubmit={commitSpelling} />}
          {(type === 'choice' || type === 'truefalse') && (
            <ChoiceQuestion q={q} picked={picked} revealed={revealed} onPick={commitChoice} />
          )}
          {type === 'listening' && (
            <ListeningQuestion q={q} picked={picked} revealed={revealed} onPick={commitChoice} />
          )}
          {type === 'response' && (
            <ResponseQuestion q={q} picked={picked} revealed={revealed} onPick={commitChoice} />
          )}

          {revealed && q.explanation && (
            <div className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200">
              💡 {q.explanation}
            </div>
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

function TypeBadge({ type }: { type: QuizType }) {
  const m = TYPE_META[type];
  const Icon = m.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', m.color)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

interface BaseProps {
  q: QuizQuestion;
  revealed: boolean;
}

function ChoiceQuestion({
  q,
  picked,
  revealed,
  onPick,
}: BaseProps & { picked: number | null; onPick: (i: number) => void }) {
  if (!q.options || q.answerIndex === undefined) return null;
  return (
    <>
      <p className="text-base font-medium mb-4 leading-relaxed">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answerIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => onPick(i)}
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
    </>
  );
}

function ListeningQuestion({
  q,
  picked,
  revealed,
  onPick,
}: BaseProps & { picked: number | null; onPick: (i: number) => void }) {
  if (!q.options || q.answerIndex === undefined) return null;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Headphones className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">听音频选择正确的中文意思</span>
        {q.audio && <ReplayButton text={q.audio} />}
      </div>
      {q.audio && <ListenPlayer text={q.audio} />}
      <p className="text-base font-medium mb-3 leading-relaxed">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answerIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => onPick(i)}
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
    </>
  );
}

function ResponseQuestion({
  q,
  picked,
  revealed,
  onPick,
}: BaseProps & { picked: number | null; onPick: (i: number) => void }) {
  if (!q.options || q.answerIndex === undefined) return null;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Headphones className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">听问句,选出最合适的回答</span>
        {q.audio && <ReplayButton text={q.audio} />}
      </div>
      {q.audio && <ListenPlayer text={q.audio} />}
      <p className="text-xs text-muted-foreground mb-2">听到的句子:</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answerIndex;
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => onPick(i)}
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
    </>
  );
}

function ListenPlayer({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const onPlay = () => {
    setPlaying(true);
    speak(text, {
      rate: 0.85,
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    }).catch(() => setPlaying(false));
  };
  useEffect(() => {
    onPlay();
    return () => stopSpeak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <div className="mb-3 rounded-md border bg-muted/40 px-3 py-2 flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={onPlay}
        className="rounded-full bg-primary text-primary-foreground p-1.5 hover:opacity-90"
        aria-label="播放"
      >
        <Volume2 className="h-4 w-4" />
      </button>
      <span className="text-muted-foreground">{playing ? '正在播放…' : '已自动播放一次,听不清可重播'}</span>
    </div>
  );
}

function ReplayButton({ text, label = '重新播放' }: { text: string; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => speak(text, { rate: 0.85 }).catch(() => {})}
      className="gap-1"
    >
      <Volume2 className="h-4 w-4" />
      {label}
    </Button>
  );
}

function SpellingQuestion({ q, revealed, onSubmit }: BaseProps & { onSubmit: (typed: string) => void }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [q.id]);
  const accepted = (q.answer ?? '').split('|').map((s) => s.trim());
  const norm = (s: string) => s.replace(/[\s\u3000]/g, '').toLowerCase();
  const typedNorm = norm(val);
  const matched = accepted.some((a) => norm(a) === typedNorm);
  const correct = accepted[0];
  return (
    <>
      <p className="text-sm text-muted-foreground mb-2">请写出下面词语的读音(假名):</p>
      <div className="mb-4 rounded-md border-2 border-dashed bg-muted/30 p-6 text-center">
        <p className="text-2xl font-bold tracking-wider">{q.prompt || q.question}</p>
        {q.audio && (
          <div className="mt-2 flex justify-center">
            <ReplayButton text={q.audio} label="听发音" />
          </div>
        )}
      </div>
      {!revealed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (val.trim()) onSubmit(val.trim());
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="输入假名…例如:いちじていし"
            className="flex-1"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={!val.trim()}>
            提交
          </Button>
        </form>
      ) : (
        <div
          className={cn(
            'rounded-md p-3 text-sm flex items-start gap-2',
            matched ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'bg-destructive/10 text-destructive',
          )}
        >
          {matched ? <Check className="h-4 w-4 mt-0.5" /> : <X className="h-4 w-4 mt-0.5" />}
          <div>
            <div>你的答案: <strong>{val || '(空)'}</strong></div>
            {!matched && <div>正确答案: <strong>{correct}</strong></div>}
            {accepted.length > 1 && <div className="text-xs text-muted-foreground mt-1">可接受的答案: {accepted.join(' / ')}</div>}
          </div>
        </div>
      )}
    </>
  );
}

function SpellAudioQuestion({ q, revealed, onSubmit }: BaseProps & { onSubmit: (typed: string) => void }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, [q.id]);
  const accepted = (q.answer ?? '').split('|').map((s) => s.trim());
  const norm = (s: string) => s.replace(/[\s\u3000]/g, '').toLowerCase();
  const typedNorm = norm(val);
  const matched = accepted.some((a) => norm(a) === typedNorm);
  const correct = accepted[0];
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Headphones className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">听音频,写出听到的假名</span>
      </div>
      {q.audio && <ListenPlayer text={q.audio} />}
      <p className="text-xs text-muted-foreground mb-2">听到的内容:</p>
      {!revealed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (val.trim()) onSubmit(val.trim());
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="输入你听到的假名…"
            className="flex-1"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={!val.trim()}>
            提交
          </Button>
        </form>
      ) : (
        <div
          className={cn(
            'rounded-md p-3 text-sm flex items-start gap-2',
            matched ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100' : 'bg-destructive/10 text-destructive',
          )}
        >
          {matched ? <Check className="h-4 w-4 mt-0.5" /> : <X className="h-4 w-4 mt-0.5" />}
          <div>
            <div>你的答案: <strong>{val || '(空)'}</strong></div>
            {!matched && <div>正确答案: <strong>{correct}</strong></div>}
            {accepted.length > 1 && <div className="text-xs text-muted-foreground mt-1">可接受的答案: {accepted.join(' / ')}</div>}
          </div>
        </div>
      )}
    </>
  );
}
