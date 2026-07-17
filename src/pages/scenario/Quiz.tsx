import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Check, X, RotateCcw, Trophy, Volume2, Headphones, Pencil, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/cn';
import { speak, stopSpeak } from '@/lib/speech';
import type { QuizQuestion, QuizType, ScenarioData } from '@/types';

interface Props {
  data: ScenarioData;
  onComplete?: (score: number) => void;
}

/** 根据题目字段推断类型(向后兼容老数据) */
function inferType(q: QuizQuestion): QuizType {
  if (q.type) return q.type;
  if (q.answer && !q.options) return q.audio ? 'spell-audio' : 'spelling';
  if (q.audio) {
    // 听音频 + 2 个选项 → 真假判断; 4 个选项 → 听力选择
    return (q.options?.length ?? 0) <= 2 ? 'listening' : 'listening';
  }
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

export function QuizView({ data, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  /** 每题作答结果: true=正确, false=错误(拼写题:输入字符串;其他:picked index) */
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);

  const q = data.quiz[idx];
  const type = q ? inferType(q) : 'choice';

  // 切题/卸载时停 TTS
  useEffect(() => {
    return () => stopSpeak();
  }, []);

  // 进入新题:自动播 audio(如果有)
  useEffect(() => {
    if (!q) return;
    if (q.audio && (type === 'listening' || type === 'response' || type === 'spell-audio')) {
      // 给浏览器一点时间加载 voice
      const t = setTimeout(() => {
        speak(q.audio!, { rate: 0.85 }).catch(() => {});
      }, 200);
      return () => clearTimeout(t);
    }
  }, [idx, q, type]);

  if (!q) return null;

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
    if (idx === data.quiz.length - 1) {
      setFinished(true);
      onComplete?.(score);
      return;
    }
    setIdx((v) => v + 1);
    setPicked(null);
    setRevealed(false);
  }

  function restart() {
    setIdx(0);
    setPicked(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  }

  if (finished) {
    const pct = Math.round((score / data.quiz.length) * 100);
    return (
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-2xl font-bold mb-2">测试完成!</h2>
        <p className="text-muted-foreground mb-4">
          你答对了 <span className="text-2xl font-bold text-primary">{score}</span> / {data.quiz.length} 题 ({pct}%)
        </p>
        <Progress value={pct} className="mb-6 max-w-xs mx-auto" />
        <div className="space-y-2 text-left max-w-md mx-auto mb-6 max-h-96 overflow-y-auto">
          {data.quiz.map((qq, i) => {
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
        <Button onClick={restart}>
          <RotateCcw className="h-4 w-4" /> 再来一次
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>第 {idx + 1} 题 / 共 {data.quiz.length} 题</span>
          <span>已答对 {score} 题</span>
        </div>
        <Progress value={((idx + 1) / data.quiz.length) * 100} className="mt-2" />
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <TypeBadge type={type} />
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
                {idx === data.quiz.length - 1 ? '查看成绩' : '下一题 →'}
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

/** 自动播放一次的播放器,带 re-play 按钮 */
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
  // 自动播一次
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
