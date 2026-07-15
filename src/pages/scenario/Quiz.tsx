import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, X, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ScenarioData } from '@/types';

interface Props {
  data: ScenarioData;
  onComplete?: (score: number) => void;
}

export function QuizView({ data, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const q = data.quiz[idx];
  if (!q) return null;

  function pick(i: number) {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    const isCorrect = i === q.answerIndex;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((a) => [...a, i]);
  }

  function next() {
    if (idx === data.quiz.length - 1) {
      setFinished(true);
      onComplete?.(score + (picked === q.answerIndex ? 0 : 0));
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
        <div className="space-y-2 text-left max-w-md mx-auto mb-6">
          {data.quiz.map((qq, i) => (
            <div
              key={qq.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded text-sm',
                answers[i] === qq.answerIndex ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-destructive/10',
              )}
            >
              {answers[i] === qq.answerIndex ? (
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{i + 1}. {qq.question}</div>
                <div className="text-xs mt-0.5">
                  正确答案: <strong>{qq.options[qq.answerIndex]}</strong>
                </div>
                {qq.explanation && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">{qq.explanation}</div>
                )}
              </div>
            </div>
          ))}
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
