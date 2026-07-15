import { useMemo, useState } from 'react';
import { Search, Shuffle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WordCard } from '@/components/feature/WordCard';
import type { ScenarioData } from '@/types';

export function WordsView({ data }: { data: ScenarioData }) {
  const [keyword, setKeyword] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(false);

  const tags = useMemo(() => {
    const set = new Set<string>();
    data.words.forEach((w) => w.tag?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(() => {
    let list = data.words;
    if (tag) list = list.filter((w) => w.tag?.includes(tag));
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (w) =>
          w.jp.includes(keyword) ||
          w.reading.includes(keyword) ||
          w.meaning.includes(keyword) ||
          (w.romaji ?? '').toLowerCase().includes(k),
      );
    }
    if (shuffle) list = [...list].sort(() => Math.random() - 0.5);
    return list;
  }, [data, tag, keyword, shuffle]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索单词 / 假名 / 中文..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={shuffle ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShuffle((v) => !v)}
          >
            <Shuffle className="h-4 w-4" /> 随机
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={tag === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTag(null)}
            className="h-7 text-xs"
          >
            全部 ({data.words.length})
          </Button>
          {tags.map((t) => {
            const count = data.words.filter((w) => w.tag?.includes(t)).length;
            return (
              <Button
                key={t}
                variant={tag === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTag(t)}
                className="h-7 text-xs"
              >
                {t} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">没找到相关单词</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((w) => (
            <WordCard key={w.id} scenarioId={data.meta.id} word={w} />
          ))}
        </div>
      )}
    </div>
  );
}
