import { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, Eye, EyeOff, ChevronRight, RotateCcw, Settings, Languages, BookOpen, Music, PenLine, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feature/EmptyState';
import { speak, stopSpeak } from '@/lib/speech';
import { processRomaji, hiraganaToRomaji } from '@/lib/romaji';
import { cn } from '@/lib/cn';
import type { ScenarioData, WordEntry } from '@/types';

// 5 种显示模式
type DisplayMode = 'all' | 'kana-kanji' | 'kanji' | 'kana-romaji' | 'listen';
// 输入方式
type InputType = 'hiragana' | 'romaji';
// 练习 vs 考试
type SessionMode = 'practice' | 'exam';

const DISPLAY_MODES: { key: DisplayMode; label: string; desc: string }[] = [
  { key: 'all', label: '全提示', desc: '假名 + 汉字 + 罗马字' },
  { key: 'kana-kanji', label: '假名+汉字', desc: '只显示假名 + 汉字' },
  { key: 'kanji', label: '只汉字', desc: '只显示汉字' },
  { key: 'kana-romaji', label: '假名+罗马字', desc: '只显示假名 + 罗马字' },
  { key: 'listen', label: '听写模式', desc: '全部隐藏,TTS 播放' },
];

// 每个词的拆分 token(空格分隔的多个 sub-word)
interface WordToken {
  jp: string;
  reading: string;
  romaji: string;
}

function splitBySpace(s: string): string[] {
  // 兼容全角空格和半角空格
  return s.split(/[\s　]+/).filter(Boolean);
}

function normalizeForCompare(s: string): string {
  return s.replace(/[\s　]+/g, '').toLowerCase();
}

interface Props {
  data: ScenarioData;
}

export function TypingView({ data }: Props) {
  // 用场景的所有 words 作为词库(自动过滤掉无 romaji/reading 的)
  const allWords = useMemo<WordEntry[]>(() => {
    return data.words.filter((w) => w.jp && w.reading);
  }, [data.words]);

  // 打乱的词序
  const [words, setWords] = useState<WordEntry[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('kana-romaji');
  const [inputType, setInputType] = useState<InputType>('romaji');
  const [sessionMode, setSessionMode] = useState<SessionMode>('practice');
  const [revealed, setRevealed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, errors: 0, completed: 0 });
  const [totalTyped, setTotalTyped] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const startTimeRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  // 用 ref 锁定当前 currentIdx/inputType,避免 useEffect 误触发
  const lockRef = useRef(false);

  // 初始化时打乱词序
  useEffect(() => {
    if (allWords.length === 0) return;
    setWords(shuffle(allWords));
    setCurrentIdx(0);
    setInputValue('');
    setRevealed(false);
    startTimeRef.current = Date.now();
    setStats({ wpm: 0, accuracy: 100, errors: 0, completed: 0 });
    setTotalTyped(0);
    setTotalCorrect(0);
    setTotalErrors(0);
  }, [allWords]);

  // 切换词时: 听写模式自动 TTS, focus 输入框
  useEffect(() => {
    if (words.length === 0) return;
    const w = words[currentIdx];
    if (!w) return;
    setInputValue('');
    setRevealed(false);
    startTimeRef.current = Date.now();
    // 自动播放(听写模式必播,其他模式也播)
    setTimeout(() => {
      speak(w.jp, { rate: 0.85 }).catch(() => {});
    }, 200);
    inputRef.current?.focus();
    editableRef.current?.focus();
    lockRef.current = false;
  }, [currentIdx, words]);

  // 切换输入方式时: 清空输入,锁定 isDone 不跳下一题
  function toggleInputType() {
    lockRef.current = true; // 阻止 useEffect 跳下一题
    setInputType((v) => (v === 'hiragana' ? 'romaji' : 'hiragana'));
    setInputValue('');
    // 立刻解锁 (因为 inputValue 变了 isDone 可能短暂为 true)
    setTimeout(() => { lockRef.current = false; }, 50);
    inputRef.current?.focus();
    editableRef.current?.focus();
  }

  // 当前词 + token 拆分(必须在 early return 之前)
  const current = words[currentIdx] ?? allWords[0];
  const targetTokens: WordToken[] = useMemo(() => {
    if (!current) return [];
    if (!current.jp.includes(' ') && !current.jp.includes('　')) {
      return [{ jp: current.jp, reading: current.reading, romaji: current.romaji || '' }];
    }
    const jps = splitBySpace(current.jp);
    const rds = splitBySpace(current.reading);
    const rms = splitBySpace(current.romaji || '');
    return jps.map((j, i) => ({
      jp: j,
      reading: rds[i] || rds[0] || '',
      romaji: rms[i] || rms[0] || '',
    }));
  }, [current]);
  const isMulti = targetTokens.length > 1;

  // 有效 romaji (fallback: 数据里没 romaji 字段时自动从 reading 推导)
  const effectiveRomaji = useMemo(() => {
    return current.romaji || hiraganaToRomaji(current.reading || '');
  }, [current]);

  // 空态(放所有 hooks 之后)
  if (allWords.length === 0) {
    return (
      <EmptyState
        title="暂无打字数据"
        description="这个场景还没有整理单词数据。打不了字。可以从单词/语法/小测学起,打字稍后补充。"
        scenarioId={data.meta.id}
      />
    );
  }

  if (!current) return null;

  // 目标输入文本(根据 inputType)
  const targetText = useMemo(() => {
    if (inputType === 'romaji') return effectiveRomaji;
    return current.reading.replace(/\s/g, ''); // 假名模式不带空格
  }, [current, inputType]);

  // 输入的当前状态分析
  const inputState = useMemo(() => {
    if (inputType === 'romaji') {
      return processRomaji(effectiveRomaji, inputValue);
    }
    // 假名模式:把用户输入转假名再比对
    const target = current.reading.replace(/\s/g, '');
    const converted = processRomaji(target, inputValue);
    let correct = 0;
    let wrong = 0;
    const kanaStr = converted.kana;
    for (let i = 0; i < kanaStr.length && i < target.length; i++) {
      if (kanaStr[i] === target[i]) correct++;
      else wrong++;
    }
    return { kana: kanaStr, consumed: kanaStr.length, buffer: converted.buffer, invalid: converted.invalid, correct, wrong };
  }, [inputType, current, inputValue]);

  // 当前词的字符状态(每个字符:未输入/正确/错误)
  // 统一逻辑:无论 inputType 是什么,都用"已确定 kana" + "无效字符数"判断
  const charStates = useMemo(() => {
    const target = inputType === 'romaji' ? (effectiveRomaji) : current.reading.replace(/\s/g, '');
    const kana = inputType === 'hiragana' ? (inputState.kana || '') : inputValue;
    const invLen = inputType === 'hiragana' ? (inputState.invalid?.length || 0) : 0;

    const states: ('pending' | 'correct' | 'wrong')[] = [];
    for (let i = 0; i < target.length; i++) {
      if (i < kana.length) {
        states.push(kana[i] === target[i] ? 'correct' : 'wrong');
      } else if (i < kana.length + invLen) {
        states.push('wrong'); // 已输入但无效字符
      } else {
        states.push('pending');
      }
    }
    return states;
  }, [inputType, current, inputValue, inputState]);

  // 当前词是否输入完成
  const isDone = useMemo(() => {
    if (inputType === 'romaji') {
      const target = normalizeForCompare(effectiveRomaji);
      const typed = normalizeForCompare(inputValue);
      return typed === target;
    }
    // hiragana 模式:转换后的假名 == target.reading
    const target = current.reading.replace(/\s/g, '');
    const kana = inputState.kana || '';
    return kana === target;
  }, [inputType, current, inputValue, inputState]);

  // 检测输入完成 → 自动下一题
  useEffect(() => {
    if (!isDone) return;
    if (lockRef.current) return; // 锁定时不跳(切换输入方式瞬间)
    const elapsed = Math.max(0.1, (Date.now() - startTimeRef.current) / 1000); // 秒
    const targetLen = inputType === 'romaji' ? (effectiveRomaji).length : (current.reading.replace(/\s/g, '')).length;
    // WPM 标准:1 word = 5 chars (英文),日文也大致用 5 chars
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((targetLen / 5) / minutes) : 0;

    setStats({
      wpm,
      accuracy: stats.accuracy,
      errors: totalErrors,
      completed: currentIdx + 1,
    });

    // 练习模式: 400ms 后自动下一题;考试模式: 不自动,按 Enter
    if (sessionMode === 'practice') {
      const t = setTimeout(() => {
        if (currentIdx < words.length - 1) {
          setCurrentIdx((v) => v + 1);
        } else {
          // 全部完成: setStats 标记完成
          setStats((s) => ({ ...s, completed: words.length }));
        }
      }, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  // 处理输入变化
  function handleInputChange(v: string) {
    if (isDone || revealed) return;
    const prev = inputValue;
    // 处理退格
    if (v.length < prev.length) {
      setInputValue(v);
      return;
    }
    // 检查新增字符:始终只接受 a-z (罗马字输入,内部按 inputType 转假名)
    const newChars = v.slice(prev.length);
    for (const c of newChars) {
      if (!/^[a-zA-Z]$/.test(c)) {
        return; // 拒绝非英文字符
      }
    }
    setInputValue(v);
    // 统计错误:基于字符级比对
    setTotalTyped((t) => t + newChars.length);
  }

  function play() {
    speak(current.jp, { rate: 0.85 }).catch(() => {});
  }

  function next() {
    if (currentIdx < words.length - 1) {
      setCurrentIdx((v) => v + 1);
    }
  }

  function reset() {
    setWords(shuffle(allWords));
    setCurrentIdx(0);
    setInputValue('');
    setRevealed(false);
    setStats({ wpm: 0, accuracy: 100, errors: 0, completed: 0 });
    setTotalTyped(0);
    setTotalCorrect(0);
    setTotalErrors(0);
  }

  function showAnswer() {
    setRevealed(true);
    // 直接填充正确的罗马字
    setInputValue(effectiveRomaji);
  }

  // 显示模式决定显示哪些行
  const showKana = displayMode !== 'kanji' && displayMode !== 'listen';
  const showKanji = displayMode !== 'kana-romaji' && displayMode !== 'listen';
  const showRomaji = displayMode === 'all' || displayMode === 'kana-romaji';

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 顶部状态栏 */}
      <Card className="p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono"><strong className="text-emerald-600 dark:text-emerald-400">{stats.wpm}</strong> WPM</span>
            <span className="font-mono"><strong className="text-emerald-600 dark:text-emerald-400">{stats.accuracy}</strong>% 准确</span>
            <span className="font-mono"><strong className="text-rose-500">{totalErrors}</strong> 错误</span>
          </div>
          <div className="text-muted-foreground">
            {stats.completed} / {words.length}
          </div>
        </div>
      </Card>

      {/* 主显示区 */}
      <Card className="p-6 md:p-10 min-h-[260px] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* 听写模式特殊: 显示音频图标 + 提示 */}
        {displayMode === 'listen' && (
          <div className="text-center mb-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2 animate-pulse">
              <Volume2 className="h-6 w-6" />
            </div>
            <p className="text-xs text-muted-foreground">听音频,打出正确的假名</p>
          </div>
        )}

        {/* 振假名(顶部小字) */}
        {showKana && (
          <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-2 text-sm text-emerald-600 dark:text-emerald-400">
            {targetTokens.map((tk, i) => (
              <div key={i} className="flex flex-col items-center min-w-[3ch]">
                <div className="font-mono text-[11px] leading-tight">{tk.reading}</div>
                <div className={cn('font-bold text-2xl md:text-3xl leading-tight', !showKanji && 'text-foreground')}>{tk.jp}</div>
              </div>
            ))}
          </div>
        )}

        {/* 只汉字模式(无假名) */}
        {!showKana && showKanji && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-2xl md:text-3xl font-bold text-foreground">
            {targetTokens.map((tk, i) => (
              <span key={i} className="min-w-[2ch] text-center">{tk.jp}</span>
            ))}
          </div>
        )}

        {/* 罗马字行 */}
        {showRomaji && (
          <div className="font-mono text-xl md:text-2xl text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">
            {displayMode === 'kana-romaji' ? effectiveRomaji : effectiveRomaji}
          </div>
        )}

        {/* 中文意思(练习模式显示,考试模式隐藏) */}
        {sessionMode === 'practice' && current.meaning && (
          <div className="text-sm text-muted-foreground mt-2">{current.meaning}</div>
        )}
      </Card>

      {/* 输入区 - 字符级可视化(虚线 + 输入融为一体) */}
      <Card className="p-6 bg-muted/30 relative">
        {/* 字符显示层 + 输入层叠加 */}
        <div className="relative">
          {/* 字符状态显示(下划线 + 颜色 + 占位字符) */}
          <div
            ref={editableRef}
            className="font-mono text-3xl md:text-4xl tracking-wider min-h-[64px] break-all flex flex-wrap items-center justify-center gap-x-1 select-none"
          >
            {charStates.map((state, i) => {
              const target = (inputType === 'romaji' ? (effectiveRomaji) : current.reading.replace(/\s/g, ''));
              const ch = target[i] ?? '';
              return (
                <span
                  key={i}
                  className={cn(
                    'inline-block min-w-[1ch] text-center pb-1 border-b-2',
                    state === 'correct' && 'text-emerald-600 dark:text-emerald-400 border-emerald-500 font-bold',
                    state === 'wrong' && 'text-rose-500 line-through opacity-70 border-rose-400',
                    state === 'pending' && 'text-foreground/40 border-foreground/25 border-solid',
                  )}
                >
                  {ch}
                </span>
              );
            })}
          </div>

          {/* 透明 input 接收键盘 - 覆盖在装饰层 */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); next(); }
              if (e.key === 'Escape') { e.preventDefault(); showAnswer(); }
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={isDone || revealed}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            style={{ caretColor: 'transparent' }}
          />
        </div>

        {/* 提示文本 */}
        <div className="text-center mt-3 text-xs text-muted-foreground">
          {displayMode === 'listen' ? '🔊 听音频,在虚线处打字' : `⌨ 点击虚线处直接打字 · 当前输入: ${inputType === 'hiragana' ? '假名 (罗马字自动转)' : '罗马字'}`}
        </div>

        {/* 考试模式:错了不提示,只显示进度 */}
        {revealed && (
          <div className="mt-3 text-sm text-rose-500">
            ❌ 正确答案: <span className="font-mono">{current.reading}</span> ({current.jp})
          </div>
        )}
      </Card>

      {/* 控制条 - flowtype 风格 */}
      <div className="flex items-center justify-center gap-2 md:gap-3 text-muted-foreground">
        <Button variant="ghost" size="icon" onClick={play} title="重听">
          <Volume2 className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={showAnswer} title="显示答案 (Esc)">
          {revealed ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={next} title="下一题 (Enter)">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleInputType}
          title={`输入方式: ${inputType === 'hiragana' ? '假名' : '罗马字'} (点此切换)`}
        >
          <Languages className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSessionMode((v) => (v === 'practice' ? 'exam' : 'practice'))}
          title={`模式: ${sessionMode === 'practice' ? '练习' : '考试'}`}
        >
          {sessionMode === 'practice' ? <GraduationCap className="h-5 w-5" /> : <PenLine className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} title="重新开始">
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings((v) => !v)} title="显示模式">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* 显示模式设置面板 */}
      {showSettings && (
        <Card className="p-4 space-y-2 animate-fade-in">
          <div className="text-xs font-semibold text-muted-foreground mb-2">显示模式 (5 种)</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {DISPLAY_MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setDisplayMode(m.key)}
                className={cn(
                  'p-3 rounded-md border text-left text-xs transition-all',
                  displayMode === m.key
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'hover:border-primary/50',
                )}
              >
                <div className="font-semibold">{m.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-3">
            <span>输入: <strong className="text-foreground">{inputType === 'hiragana' ? '假名' : '罗马字'}</strong></span>
            <span>·</span>
            <span>模式: <strong className="text-foreground">{sessionMode === 'practice' ? '练习(显示意思,错了提示)' : '考试(不显示意思)'}</strong></span>
          </div>
        </Card>
      )}

      {/* 完成所有题 */}
      {currentIdx >= words.length - 1 && isDone && (
        <Card className="p-5 bg-emerald-500/10 border-emerald-500/30 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">🎉 完成!</div>
            <div className="text-sm text-muted-foreground">
              共 <strong>{words.length}</strong> 词 · WPM <strong>{stats.wpm}</strong> · 准确率 <strong>{stats.accuracy}%</strong> · 错误 <strong>{totalErrors}</strong>
            </div>
            <Button onClick={reset} className="mt-2">
              再来一轮
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}