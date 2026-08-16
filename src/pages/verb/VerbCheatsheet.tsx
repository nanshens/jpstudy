import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, Search, Eye, EyeOff } from 'lucide-react';
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

export function VerbCheatsheet() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4">
      <Link to="/verbs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回动词变形
      </Link>

      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50">
        <div className="flex items-center gap-2 text-base font-bold">
          ⚡ {data.commonVerbs.length} 个常用动词 × {FORM_COLS.length} 种形态
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          点击单元格可发音 · 长按 / 点击「显示」可揭示答案 · 默写后核对用
        </p>
      </Card>

      {/* 控制条 */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索动词(词典形/读音/意思)...例如:食べる, たべる, 吃"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setRevealAll((v) => !v)}
          className="gap-1"
        >
          {revealAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {revealAll ? '全部隐藏' : '全部显示'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        共 {filtered.length} 个动词 · 选中 {revealed.size} / {filtered.length * FORM_COLS.length} 格
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-3 py-2 sticky left-0 bg-muted/30 z-10 min-w-[140px]">动词</th>
              <th className="text-left px-3 py-2 min-w-[80px]">读音</th>
              <th className="text-left px-3 py-2 min-w-[80px]">意思</th>
              {FORM_COLS.map((c) => (
                <th key={c.key} className="text-center px-2 py-2 min-w-[80px]">
                  <div className="text-[11px] font-semibold">{c.short}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b hover:bg-muted/20">
                <td className="px-3 py-1.5 sticky left-0 bg-background z-10">
                  <button
                    onClick={() => speak(v.dictionary, { rate: 0.85 }).catch(() => {})}
                    className="font-mono font-medium hover:text-primary text-left flex items-center gap-1"
                  >
                    {v.dictionary}
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground text-xs">{v.reading}</td>
                <td className="px-3 py-1.5 text-muted-foreground text-xs">
                  <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] mr-1', TYPE_COLOR[v.type])}>
                    {TYPE_LABEL[v.type]}
                  </span>
                  {v.meaning}
                </td>
                {FORM_COLS.map((c) => {
                  const val = v.forms[c.key] ?? '';
                  const id = `${v.id}:${c.key}`;
                  const show = revealAll || revealed.has(id);
                  return (
                    <td key={c.key} className="px-1.5 py-1 text-center">
                      <button
                        onClick={() => {
                          if (!show) toggleCell(v.id, c.key);
                          if (val) speak(val, { rate: 0.85 }).catch(() => {});
                        }}
                        className={cn(
                          'w-full min-h-[28px] rounded font-mono text-xs transition-all px-1',
                          show
                            ? 'text-foreground hover:bg-pink-50 dark:hover:bg-pink-950/30'
                            : 'text-muted-foreground bg-muted/30 hover:bg-muted/60',
                        )}
                        title={`${v.dictionary} → ${c.label}`}
                      >
                        {show ? val : '？'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
