// 运行时从 /public/data 拉取 JSON
// 添加新场景:在 scenarios-index.json 加一行 + 在 public/data/scenarios/<id>/ 扔数据文件
// 修改内容:直接编辑 public/data/ 下的 JSON
// 代码完全不需要改

import type {
  KanaRow,
  ScenarioMeta,
  ScenarioData,
  WordEntry,
  GrammarEntry,
  Dialog,
  ListeningItem,
  QuizQuestion,
} from '@/types';

// 五十音数据结构(seion 清音 / dakuten 浊音 / combo 拗音)
export interface KanaData {
  seion: KanaRow[];
  dakuten: KanaRow[];
  combo: KanaRow[];
}

// 基础路径
const KANA_URL = '/data/kana.json';
const SCENARIOS_INDEX_URL = '/data/scenarios-index.json';
const SCENARIO_BASE = (id: string) => `/data/scenarios/${id}`;

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`[loader] GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function fetchJSONOrDefault<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJSON<T>(url);
  } catch {
    return fallback;
  }
}

// ============== 五十音图 ==============
export async function loadKana(): Promise<KanaData> {
  const data = await fetchJSON<{
    seion: KanaRow[];
    dakuten: KanaRow[];
    combo: KanaRow[];
  }>(KANA_URL);
  return {
    seion: data.seion,
    dakuten: data.dakuten,
    combo: data.combo,
  };
}

// ============== 场景索引 ==============
/**
 * 拉取所有场景的 meta 列表(运行时从 /data/scenarios-index.json)
 * 列表里的 ScenarioMeta 来自一个独立的清单文件,跟各场景子目录里的数据文件解耦
 */
export async function loadScenarioMetas(): Promise<ScenarioMeta[]> {
  return fetchJSON<ScenarioMeta[]>(SCENARIOS_INDEX_URL);
}

/**
 * 加载单个场景的完整数据:
 *  - meta 优先从 scenarios-index.json 里查(避免额外请求)
 *  - 5 个数据文件(单词/语法/对话/听力/小测)并行拉取,任意一个缺失就用空数组兜底
 */
export async function loadScenario(id: string): Promise<ScenarioData | null> {
  // 1) 先拿 meta
  let meta: ScenarioMeta | undefined;
  try {
    const metas = await loadScenarioMetas();
    meta = metas.find((m) => m.id === id);
  } catch (e) {
    console.warn('[loader] scenarios-index.json 拉取失败,尝试读子目录 meta.json', e);
  }
  if (!meta) {
    // 兜底:子目录里如果有 meta.json 也能用
    meta = await fetchJSONOrDefault<ScenarioMeta | undefined>(
      `${SCENARIO_BASE(id)}/meta.json`,
      undefined as unknown as ScenarioMeta | undefined,
    );
  }
  if (!meta) return null;

  // 2) 并行拉 5 个数据文件
  const base = SCENARIO_BASE(id);
  const [words, grammar, dialogs, listening, quiz] = await Promise.all([
    fetchJSONOrDefault<WordEntry[]>(`${base}/words.json`, []),
    fetchJSONOrDefault<GrammarEntry[]>(`${base}/grammar.json`, []),
    fetchJSONOrDefault<Dialog[]>(`${base}/dialogs.json`, []),
    fetchJSONOrDefault<ListeningItem[]>(`${base}/listening.json`, []),
    fetchJSONOrDefault<QuizQuestion[]>(`${base}/quiz.json`, []),
  ]);

  return { meta, words, grammar, dialogs, listening, quiz };
}
