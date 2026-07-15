import { useEffect, useState } from 'react';
import { Volume2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { KanaCell } from '@/components/feature/KanaCell';
import { SpeakButton } from '@/components/feature/SpeakButton';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadKana, type KanaData } from '@/lib/loader';
import { speak } from '@/lib/speech';
import type { KanaRow } from '@/types';

type Highlight = 'hiragana' | 'katakana' | 'both';

export function KanaPage() {
  const [kana, setKana] = useState<KanaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [highlight, setHighlight] = useState<Highlight>('both');
  const [showRomaji, setShowRomaji] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadKana()
      .then((d) => { if (!cancelled) setKana(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  if (error) {
    return (
      <PageError
        message={`五十音数据加载失败:${error}`}
        onRetry={() => { setError(null); setRetryKey((k) => k + 1); }}
      />
    );
  }
  if (!kana) return <PageLoader label="加载五十音图…" />;

  const SEION_ROWS = kana.seion;
  const DAKUTEN_ROWS = kana.dakuten;
  const COMBO_ROWS = kana.combo;

  function speakRow(row: string) {
    const cells = [...SEION_ROWS, ...DAKUTEN_ROWS, ...COMBO_ROWS]
      .find((r) => r.consonant === row)
      ?.cells.filter((c) => c.hiragana)
      .map((c) => c.romaji);
    if (cells && cells.length) speak(cells.join(' '), { rate: 0.6 });
  }

  function speakAll() {
    const all = [...SEION_ROWS, ...DAKUTEN_ROWS, ...COMBO_ROWS]
      .flatMap((r) => r.cells.filter((c) => c.romaji).map((c) => c.romaji));
    speak(all.join(' '), { rate: 0.5 });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">五十音图</h1>
          <p className="text-sm text-muted-foreground mt-1">点击任意假名,听发音 · 点击右下角切换平假名/片假名</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={speakAll}>
            <Volume2 className="h-4 w-4" /> 全部朗读
          </Button>
          <Button
            variant={showRomaji ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowRomaji((v) => !v)}
          >
            {showRomaji ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            罗马音
          </Button>
          <div className="inline-flex rounded-md border bg-muted p-0.5">
            {(['hiragana', 'katakana', 'both'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHighlight(h)}
                className={`px-2.5 py-1 text-xs rounded ${highlight === h ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              >
                {h === 'hiragana' ? '平' : h === 'katakana' ? '片' : '両方'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="seion">
        <TabsList className="w-full justify-start overflow-x-auto scrollbar-thin">
          <TabsTrigger value="seion">清音</TabsTrigger>
          <TabsTrigger value="dakuten">浊音・半浊音</TabsTrigger>
          <TabsTrigger value="combo">拗音</TabsTrigger>
        </TabsList>

        <TabsContent value="seion">
          <KanaTable rows={SEION_ROWS} highlight={highlight} onSpeakRow={speakRow} showRomaji={showRomaji} />
        </TabsContent>
        <TabsContent value="dakuten">
          <KanaTable rows={DAKUTEN_ROWS} highlight={highlight} onSpeakRow={speakRow} showRomaji={showRomaji} />
        </TabsContent>
        <TabsContent value="combo">
          <KanaTable rows={COMBO_ROWS} highlight={highlight} onSpeakRow={speakRow} showRomaji={showRomaji} />
        </TabsContent>
      </Tabs>

      {/* Tip */}
      <Card className="bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/40">
        <CardContent className="p-4 text-sm text-blue-900 dark:text-blue-200">
          💡 <strong>小贴士</strong>:五十音图是日语的"字母表",先熟清音(あ-ん),再学浊音(が/ざ/だ/ば)和半浊音(ぱ),
          最后是拗音(きゃ/しゃ等)。在驾考场景里,<span className="jp">教官</span>、<span className="jp">一時停止</span>、
          <span className="jp">徐行</span>、<span className="jp">横断歩道</span> 这些词都会频繁出现。
        </CardContent>
      </Card>
    </div>
  );
}

interface TableProps {
  rows: KanaRow[];
  highlight: Highlight;
  onSpeakRow: (row: string) => void;
  showRomaji: boolean;
}

function KanaTable({ rows, highlight, onSpeakRow, showRomaji }: TableProps) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.consonant} className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => onSpeakRow(row.consonant)}
            className="hidden md:flex w-24 shrink-0 items-center justify-center rounded-md border bg-muted/40 hover:bg-muted text-sm jp"
            title="点击听本行发音"
          >
            {row.consonant || '—'}
          </button>
          <div
            className="grid gap-1.5 flex-1"
            style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
          >
            {row.cells.map((cell, i) => (
              <div key={i} className="relative">
                <KanaCell cell={cell} highlight={highlight} />
                {showRomaji && cell.romaji && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-mono">
                    {cell.romaji}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
