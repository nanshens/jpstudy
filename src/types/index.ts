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

/**
 * Quiz 题型:
 *  - 'choice'    选择题(默认,2-4 个 options + answerIndex)
 *  - 'truefalse' 真假判断(2 个 options「正しい/正しくない」或类似)
 *  - 'response'  听力选择回答(播放问句的音频,从 options 选回答)
 *  - 'spelling'  拼写测试(看 kanji 写假名)
 *  - 'listening' 听力选择(播放音频,看中文选项选正确答案)或听力判断
 *  - 'spell-audio' 听力拼写(只听音频,输入假名)
 */
export type QuizType =
  | 'choice'
  | 'truefalse'
  | 'response'
  | 'spelling'
  | 'listening'
  | 'spell-audio';

export interface QuizQuestion {
  id: string;
  /** 题型;缺省时根据 options 长度和 audio/answer 字段推断 */
  type?: QuizType;
  /** 主题目文本(中文/日文均可,按题型决定) */
  question: string;
  /** TTS 要朗读的日文;存在时进入题目就自动播放 */
  audio?: string;
  /** 拼写题里显示给用户的 kanji 词(可选) */
  prompt?: string;
  /** 选项:choice/truefalse/response 必填 */
  options?: string[];
  /** 选择题正确答案 index(0-based) */
  answerIndex?: number;
  /**
   * 拼写题正确答案(假名,允许多个变体用 | 分隔,例如 "いちじ|イチジ")
   * 也可填英式读音做兜底匹配
   */
  answer?: string;
  /** 拼写题答案格式,给用户做提示 */
  answerFormat?: 'hiragana' | 'katakana' | 'romaji';
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
