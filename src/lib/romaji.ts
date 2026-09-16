// 简化的 romaji → hiragana 转换器
// 输入: 部分罗马字(如 "guu", "guuz")
// 输出: 已转换的假名 + 状态信息
// 覆盖: 元音/KSTNHMRW/GZD/B/P 行 + 拗音 + 促音 + 长音

const ROMAJI_MAP: Record<string, string> = {
  // 元音
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  // K
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  // S
  sa: 'さ', shi: 'し', su: 'す', se: 'せ', so: 'そ',
  // T
  ta: 'た', chi: 'ち', tsu: 'つ', te: 'て', to: 'と',
  // N
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  // H
  ha: 'は', hi: 'ひ', fu: 'ふ', he: 'へ', ho: 'ほ',
  // M
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  // Y
  ya: 'や', yu: 'ゆ', yo: 'よ',
  // R
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  // W
  wa: 'わ', wo: 'を',
  // G
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  // Z
  za: 'ざ', ji: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  // D
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  // B
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  // P
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  // 拗音
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sha: 'しゃ', shu: 'しゅ', sho: 'しょ',
  sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  cha: 'ちゃ', chu: 'ちゅ', cho: 'ちょ',
  tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  ja: 'じゃ', ju: 'じゅ', jo: 'じょ',
  zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
  // 外来音
  fa: 'ふぁ', fi: 'ふぃ', fe: 'ふぇ', fo: 'ふぉ',
  va: 'ゔぁ', vi: 'ゔぃ', vu: 'ゔ', ve: 'ゔぇ', vo: 'ゔぉ',
  // 拨音
  n: 'ん',
  // 特殊
  xtu: 'っ', xtsu: 'っ',
  // 长音 (在实际打字里通常不需要显式输入,系统允许多打元音)
  '~': 'ー',
};

interface RomajiMatchResult {
  kana: string;        // 已转换的假名
  consumed: number;    // 消耗的输入字符数
  pending: string;     // 还在 buffer 等待的字符
}

// 给定一段输入 romaji, 返回最佳匹配(支持延迟判定)
// 返回:
//  - kana: 已确定的假名
//  - consumed: 已经确定 + 等待中用掉的字符数
//  - pending: 还在 buffer 的字符(等下一个字符组合)
function bestMatch(input: string): RomajiMatchResult {
  if (!input) return { kana: '', consumed: 0, pending: '' };

  // 优先尝试 3 字符 (拗音 / 外来音)
  if (input.length >= 3 && ROMAJI_MAP[input.slice(0, 3)]) {
    return { kana: ROMAJI_MAP[input.slice(0, 3)], consumed: 3, pending: '' };
  }
  // 2 字符
  if (input.length >= 2 && ROMAJI_MAP[input.slice(0, 2)]) {
    return { kana: ROMAJI_MAP[input.slice(0, 2)], consumed: 2, pending: '' };
  }
  // 1 字符 (直接的元音)
  if (input.length >= 1 && ROMAJI_MAP[input[0]]) {
    return { kana: ROMAJI_MAP[input[0]], consumed: 1, pending: '' };
  }
  // 促音特殊: "kk" → っ + k 等待
  if (input.length >= 2 && 'kstphfc'.includes(input[0]) && input[0] === input[1]) {
    return { kana: 'っ', consumed: 1, pending: input.slice(1) };
  }
  // 不匹配:把整个 input 当 pending(等下一个字符再组合判定,如 's' 等待 'sh'/'sa'/'so')
  return { kana: '', consumed: 0, pending: input };
}

// 给定目标 romaji 完整字符串 + 当前 buffer, 推进转换
// 返回: { consumed: 目标 romaji 中已确认字符数, kana: 已转换假名, pendingBuffer: 剩余待定字符 }
export interface RomajiProcessResult {
  consumedRomaji: number;  // 已消耗的目标 romaji 字符数
  kana: string;             // 已转换的假名
  buffer: string;           // 当前还在等待输入的 romaji (灰色,不计错误)
  invalid: string;          // 用户输入的无效字符 (计错误)
}

export function processRomaji(target: string, buffer: string): RomajiProcessResult {
  let pos = 0; // 目标 romaji 当前位置
  let kana = '';
  let buf = buffer;
  let invalid = '';

  while (buf.length > 0 && pos < target.length) {
    // 跳过空格分隔(多词情况)
    if (target[pos] === ' ') {
      kana += ' ';
      pos++;
      continue;
    }
    if (buf[0] === ' ') {
      buf = buf.slice(1);
      continue;
    }

    const m = bestMatch(buf);
    if (m.kana) {
      kana += m.kana;
      pos += m.consumed;
      buf = m.pending;
    } else if (m.pending) {
      // 部分输入但暂未确定(如 's' 等待 'sh'/'sa'):停下来等下一个字符
      buf = m.pending;
      break;
    } else {
      // 输入无效字符
      invalid += buf[0];
      buf = buf.slice(1);
    }
  }

  return {
    consumedRomaji: pos,
    kana,
    buffer: buf,
    invalid,
  };
}

// 检查目标 romaji 是否完成
export function isRomajiComplete(target: string, buffer: string): boolean {
  // 简化: 输入的 buffer 必须包含完整目标
  const t = target.replace(/\s/g, '');
  const b = buffer.replace(/\s/g, '');
  return t === b || b.startsWith(t) === false && t.startsWith(b);
}

// 直接把完整 romaji 转换为假名 (用于"显示答案")
export function romajiToHiragana(romaji: string): string {
  const r = processRomaji(romaji, romaji);
  return r.kana + r.buffer;
}

// 假名 → 罗马字 (反向, 用于词库缺 romaji 字段时的 fallback)
// 简单版:逐字符映射,不处理拗音合并(优先长音匹配)
const HIRAGANA_TO_ROMAJI: Record<string, string> = {
  // 元音
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o',
  // K
  か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  // S
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so',
  // T
  た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  // N
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no',
  // H
  は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  // M
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  // Y
  や: 'ya', ゆ: 'yu', よ: 'yo',
  // R
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro',
  // W
  わ: 'wa', を: 'wo',
  // 拨音
  ん: 'n',
  // G
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  // Z
  ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  // D
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do',
  // B
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  // P
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
  // 拗音 (合并显示: きゃ kya)
  きゃ: 'kya', きゅ: 'kyu', きょ: 'kyo',
  しゃ: 'sha', しゅ: 'shu', しょ: 'sho',
  ちゃ: 'cha', ちゅ: 'chu', ちょ: 'cho',
  にゃ: 'nya', にゅ: 'nyu', にょ: 'nyo',
  ひゃ: 'hya', ひゅ: 'hyu', ひょ: 'hyo',
  みゃ: 'mya', みゅ: 'myu', みょ: 'myo',
  りゃ: 'rya', りゅ: 'ryu', りょ: 'ryo',
  ぎゃ: 'gya', ぎゅ: 'gyu', ぎょ: 'gyo',
  じゃ: 'ja', じゅ: 'ju', じょ: 'jo',
  びゃ: 'bya', びゅ: 'byu', びょ: 'byo',
  ぴゃ: 'pya', ぴゅ: 'pyu', ぴょ: 'pyo',
  // 促音
  っ: '',
  // 长音
  ー: '',
};

/**
 * 把片假名转平假名 (外来语 reading 字段常用片假名,需要先 normalize)
 */
function katakanaToHiragana(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    // 片假名 0x30A1-0x30F6 → 平假名 0x3041-0x3096 (差 0x60)
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * 把假名字符串转换为粗略的罗马字 (fallback, 当词库 romaji 字段缺失时)
 * 自动处理片假名→平假名 normalize;拗音优先 2 字符匹配,否则 1 字符
 */
export function hiraganaToRomaji(hiragana: string): string {
  const normalized = katakanaToHiragana(hiragana);
  let result = '';
  let i = 0;
  while (i < normalized.length) {
    // 长音 ー: 重复前一个元音
    if (normalized[i] === 'ー' && result.length > 0) {
      const lastVowel = result.match(/[aiueo]$/)?.[0] || '';
      result += lastVowel;
      i += 1;
      continue;
    }
    // 优先 2 字符 (拗音)
    const two = normalized.slice(i, i + 2);
    if (HIRAGANA_TO_ROMAJI[two] !== undefined) {
      result += HIRAGANA_TO_ROMAJI[two];
      i += 2;
      continue;
    }
    // 1 字符
    const one = normalized[i];
    if (HIRAGANA_TO_ROMAJI[one] !== undefined) {
      result += HIRAGANA_TO_ROMAJI[one];
    } else {
      result += one; // 未知字符保留
    }
    i += 1;
  }
  return result;
}