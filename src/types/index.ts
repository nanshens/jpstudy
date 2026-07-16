// 全局类型
export interface KanaCell {
  hiragana: string;
  katakana: string;
  romaji: string;
  // 例词
  example?: { word: string; reading: string; meaning: string };
}

export interface KanaRow {
  consonant: string; // 空白行用空字符串
  cells: KanaCell[];
  isDakuten?: boolean;
  isCombination?: boolean; // 拗音 きゃ きゅ きょ 等
  label?: string;
}

export interface WordEntry {
  id: string;
  jp: string;
  reading: string;
  romaji?: string;
  meaning: string; // 中文
  example?: { jp: string; reading: string; meaning: string };
  note?: string;
  tag?: string[]; // 标签: e.g. ['车内', '指示']
}

export interface GrammarEntry {
  id: string;
  title: string;
  pattern: string; // 句型
  meaning: string;
  explanation: string;
  examples: { jp: string; reading: string; meaning: string }[];
  note?: string;
}

export interface DialogLine {
  speaker: string; // '教官' / '私' 等
  jp: string;
  reading: string;
  meaning: string;
  note?: string;
}

export interface Dialog {
  id: string;
  title: string;
  scene: string; // 场景描述
  lines: DialogLine[];
}

export interface ListeningItem {
  id: string;
  audio: string; // 文本 (用 TTS 读)
  question: string; // 中文问题
  answer: string;
  options: string[];
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export type ScenarioTab = 'overview' | 'textbook' | 'words' | 'grammar' | 'dialogs' | 'listening' | 'quiz';

export interface ScenarioMeta {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string; // tailwind gradient classes
  description: string;
  goals: string[];
  /** 教材 PDF 文件路径(相对于 public/),设置后会在场景里显示「教材」tab */
  pdf?: string;
  /** 教材 PDF 显示名 */
  pdfLabel?: string;
}

export interface ScenarioData {
  meta: ScenarioMeta;
  words: WordEntry[];
  grammar: GrammarEntry[];
  dialogs: Dialog[];
  listening: ListeningItem[];
  quiz: QuizQuestion[];
}
