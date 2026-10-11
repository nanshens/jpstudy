// TTS 策略: 优先使用预生成的 mp3 静态资源(Google chirp3 HD 高质量),失败/缺失时 fallback 到浏览器原生 Web Speech API
// 静态 mp3 通过 scripts/generate-tts.cjs 生成,放在 public/audio/{ja,en}/<hash>.mp3

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ranked =
    voices.find((v) => /ja[-_]JP/i.test(v.lang) && /Google|Microsoft|Natural|Premium/i.test(v.name)) ||
    voices.find((v) => /ja[-_]JP/i.test(v.lang) && v.localService === false) ||
    voices.find((v) => /ja[-_]JP/i.test(v.lang)) ||
    voices.find((v) => /ja/i.test(v.lang)) ||
    null;
  return ranked;
}

function ensureVoice(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(null);
      return;
    }
    const v = pickJapaneseVoice();
    if (v) {
      cachedVoice = v;
      voicesLoaded = true;
      resolve(v);
      return;
    }
    const handler = () => {
      const found = pickJapaneseVoice();
      cachedVoice = found;
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(found);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      if (!voicesLoaded) {
        const found = pickJapaneseVoice();
        cachedVoice = found;
        resolve(found);
      }
    }, 800);
  });
}

// ---------- mp3 静态资源路径 ----------
function langFromOpts(lang?: string): 'ja' | 'en' {
  if (!lang) return 'ja';
  return lang.toLowerCase().startsWith('en') ? 'en' : 'ja';
}

function djb2(str: string): number {
  // 客户端用的轻量 hash(无需 crypto API),效果和服务器端 SHA1 前 12 字符碰撞率极低
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function toHex(n: number, len: number): string {
  return n.toString(16).padStart(len, '0').slice(-len);
}

// 服务器端 sha1(text).slice(0,12) 的客户端近似: djb2 + 二次混合 + 截前 12 字符
// 由于 generate-tts.cjs 用 sha1 前 12 字符,这里改用更稳的同名 hash (sha1 via SubtleCrypto)
async function textHash(text: string): Promise<string> {
  const normalized = String(text || '').trim().replace(/\s+/g, ' ');
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const data = new TextEncoder().encode(normalized);
      const buf = await crypto.subtle.digest('SHA-1', data);
      const hex = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return hex.slice(0, 12);
    } catch {
      // fallback
    }
  }
  // fallback: djb2 双 hash (字符少也够用)
  const a = djb2(normalized);
  const b = djb2(normalized + ':' + normalized.length);
  return toHex(a, 6) + toHex(b, 6);
}

// mp3 缓存: 同一文本/hash 不重复探测
const mp3ProbeCache = new Map<string, Promise<boolean>>();

async function mp3Exists(url: string): Promise<boolean> {
  if (mp3ProbeCache.has(url)) return mp3ProbeCache.get(url)!;
  const p = new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    fetch(url, { method: 'HEAD' })
      .then((r) => resolve(r.ok))
      .catch(() => resolve(false));
  });
  mp3ProbeCache.set(url, p);
  return p;
}

function playMp3(url: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('audio error'));
    audio.play().catch(reject);
    // 超时兜底
    setTimeout(() => {
      try { audio.pause(); } catch { /* ignore */ }
      reject(new Error('timeout'));
    }, 10000);
  });
}

// ---------- 公共 API ----------
export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: unknown) => void;
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!text || !text.trim()) return;

  const lang = opts.lang ?? 'ja-JP';
  const short = langFromOpts(lang);
  const rate = opts.rate ?? (short === 'en' ? 1.0 : 0.9);

  // 1) 优先尝试 mp3 静态资源
  try {
    const hash = await textHash(text);
    const url = `/audio/${short}/${hash}.mp3`;
    const exists = await mp3Exists(url);
    if (exists) {
      opts.onStart?.();
      await playMp3(url, rate);
      opts.onEnd?.();
      return;
    }
  } catch (e) {
    opts.onError?.(e);
    // fall through 到 Web Speech
  }

  // 2) Fallback: Web Speech API
  await speakWebSpeech(text, { ...opts, lang });
}

async function speakWebSpeech(text: string, opts: SpeakOptions): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  const lang = opts.lang ?? 'ja-JP';
  const voice = cachedVoice ?? (await ensureVoice());
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (voice && (voice.lang || '').toLowerCase().startsWith(lang.toLowerCase().slice(0, 2))) {
    utter.voice = voice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
    if (match) utter.voice = match;
  }
  utter.lang = lang;
  utter.rate = opts.rate ?? 0.9;
  utter.pitch = opts.pitch ?? 1;
  utter.volume = opts.volume ?? 1;
  utter.onstart = () => opts.onStart?.();
  utter.onend = () => opts.onEnd?.();
  utter.onerror = (e) => opts.onError?.(e);
  window.speechSynthesis.speak(utter);
}

export function stopSpeak() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  // 暂停所有 audio 元素
  if (typeof window !== 'undefined') {
    document.querySelectorAll('audio').forEach((a) => a.pause());
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined');
}

// 预热 voice
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  ensureVoice();
}