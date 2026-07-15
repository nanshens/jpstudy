// localStorage 简单包装
const PREFIX = 'jpstudy:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota / privacy mode
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },
};

// 简单的 progress 跟踪
export interface ScenarioProgress {
  visitedTabs: string[];
  knownWords: string[]; // word ids
  quizBest?: number;
  updatedAt: number;
}

export function getProgress(scenarioId: string): ScenarioProgress {
  return storage.get<ScenarioProgress>(`progress:${scenarioId}`, {
    visitedTabs: [],
    knownWords: [],
    updatedAt: Date.now(),
  });
}

export function setProgress(scenarioId: string, patch: Partial<ScenarioProgress>) {
  const cur = getProgress(scenarioId);
  const next = { ...cur, ...patch, updatedAt: Date.now() };
  storage.set(`progress:${scenarioId}`, next);
  return next;
}
