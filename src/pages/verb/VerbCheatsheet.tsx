import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, Search, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import { speak } from '@/lib/speech';
import { cn } from '@/lib/cn';
import type { VerbData, VerbEntry, VerbType } from '@/types';

const FORM_COLS: { key: keyof VerbEntry['forms']; label: string; short: string }[] = [
  { key: 'masu', label: 'ます形', short: 'ます' },
  { key: 'te', label: 'て形', short: 'て' },
  { key: 'ta', label: 'た形', short: 'た' },
  { key: 'nai', label: 'ない形', short: 'ない' },
  { key: 'nakatta', label: 'なかった', short: 'なかった' },
  { key: 'potential', label: '可能', short: 'れる/える' },
  { key: 'imperative', label: '命令', short: '命令' },
  { key: 'volitional', label: '意志', short: 'う/よう' },
  { key: 'ba', label: 'ば形', short: 'ば' },
  { key: 'passive', label: '被动', short: 'れる/される' },
  { key: 'causative', label: '使役', short: 'せる/させる' },
  { key: 'causative-passive', label: '使役被', short: 'させられる' },
  { key: 'prohibition', label: '禁止', short: 'な' },
];

const TYPE_LABEL: Record<VerbType, string> = {
  godan: 'I 类',
  ichidan: 'II 类',
  kuru: 'カ变',
  suru: 'サ变',
};

const TYPE_COLOR: Record<VerbType, string> = {
  godan: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  ichidan: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  kuru: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  suru: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
};

// 每页显示 N 个动词(横向并列),N 列 + 1 形态列 = N+1 列
// 13 行(形态) × 28px ≈ 360px,fit 浏览器一屏
const VERBS_PER_PAGE = 5;

export function VerbCheatsheet() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadVerbData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data.commonVerbs;
    return data.commonVerbs.filter((v) =>
      v.dictionary.includes(s) || v.reading.includes(s) || v.meaning.toLowerCase().includes(s),
    );
  }, [data, search]);

  // 搜索变化时回到第 1 页
  useEffect(() => {
    setPage(0);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / VERBS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageVerbs = filtered.slice(safePage * VERBS_PER_PAGE, (safePage + 1) * VERBS_PER_PAGE);

  if (error) {
    return <PageError message={`数据加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!data) return <PageLoader label="加载中…" />;

  function toggleCell(verbId: string, formKey: string) {
    const id = `${verbId}:${formKey}`;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-3">
      <Link to="/verbs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回动词变形
      </Link>

      {/* 顶部信息 + 搜索 + 显示切换 */}
      <div className="space-y-2">
        <Card className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
          <div className="flex items-center gap-2 text-sm font-bold">
            ⚡ {filtered.length} 个常用动词 × {FORM_COLS.length} 种形态
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            点击单元格可发音 · 点击揭示答案 · 默写后核对用
          </p>
        </Card>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索动词(词典形/读音/意思)...例如:食べる, たべる, 吃"
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setRevealAll((v) => !v)}
            className="gap-1 h-9"
          >
            {revealAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealAll ? '全部隐藏' : '全部显示'}
          </Button>
        </div>
      </div>

      {/* 主表 - 13 形态做左侧行标签,N 动词横铺 */}
      <Card className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `minmax(70px, 0.8fr) repeat(${pageVerbs.length}, minmax(100px, 1fr))`,
          }}
        >
          {/* 表头行:角落 + 动词 */}
          <div className="sticky left-0 top-0 z-20 bg-muted/80 backdrop-blur px-2 py-2 text-[10px] font-semibold text-muted-foreground border-b border-r">
            形态 ↓
          </div>
          {pageVerbs.map((v) => (
            <div
              key={`h-${v.id}`}
              className="sticky top-0 z-10 bg-muted/60 backdrop-blur px-2 py-2 border-b flex flex-col items-center gap-0.5 min-w-0"
            >
              <button
                onClick={() => speak(v.dictionary, { rate: 0.85 }).catch(() => {})}
                className="font-mono font-semibold text-sm hover:text-primary flex items-center gap-0.5"
              >
                {v.dictionary}
                <Volume2 className="h-3 w-3 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-muted-foreground font-mono">{v.reading}</span>
                <span className={cn('rounded px-1 py-px', TYPE_COLOR[v.type])}>{TYPE_LABEL[v.type]}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate max-w-full">{v.meaning}</div>
            </div>
          ))}

          {/* 13 行形态 */}
          {FORM_COLS.map((c) => (
            <FormRow
              key={c.key}
              col={c}
              verbs={pageVerbs}
              revealAll={revealAll}
              revealed={revealed}
              onToggle={toggleCell}
            />
          ))}
        </div>
      </Card>

      {/* 分页器 - 底部 */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="text-xs text-muted-foreground">
          共 {filtered.length} 词 · {totalPages} 页 · 本页 {pageVerbs.length} 词 · 选中 {revealed.size} 格
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
          >
            <ChevronLeft className="h-4 w-4" /> 上一页
          </Button>
          <span className="text-xs px-2 text-muted-foreground">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            下一页 <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormRowProps {
  col: { key: keyof VerbEntry['forms']; label: string; short: string };
  verbs: VerbEntry[];
  revealAll: boolean;
  revealed: Set<string>;
  onToggle: (verbId: string, formKey: string) => void;
}

function FormRow({ col, verbs, revealAll, revealed, onToggle }: FormRowProps) {
  return (
    <>
      {/* 左侧形态标签 - sticky 不动 */}
      <div
        className="sticky left-0 z-10 bg-background border-r px-2 py-1 flex items-center justify-center min-h-[28px]"
        title={col.label}
      >
        <span className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">
          {col.label}
        </span>
      </div>
      {/* N 个动词对应的该形态 cell */}
      {verbs.map((v) => {
        const val = v.forms[col.key] ?? '';
        const id = `${v.id}:${col.key}`;
        const show = revealAll || revealed.has(id);
        return (
          <button
            key={id}
            onClick={() => {
              if (!show) onToggle(v.id, col.key);
              if (val) speak(val, { rate: 0.85 }).catch(() => {});
            }}
            className={cn(
              'min-h-[28px] border-b px-1 py-0.5 font-mono text-[11px] transition-all truncate',
              show
                ? 'text-foreground hover:bg-pink-50 dark:hover:bg-pink-950/30'
                : 'text-muted-foreground bg-muted/20 hover:bg-muted/50',
            )}
            title={`${v.dictionary} → ${col.label}: ${val}`}
          >
            {show ? val : '？'}
          </button>
        );
      })}
    </>
  );
}
