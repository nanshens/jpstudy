// Web Speech API 封装 - 浏览器 TTS,无需额外资源
let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // 优先选 Japanese - 网络高质量 (Google / Microsoft) -> 本地 ja-JP -> 任何 ja
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
    // 部分浏览器异步加载 voice
    const handler = () => {
      const found = pickJapaneseVoice();
      cachedVoice = found;
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(found);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // 兜底超时
    setTimeout(() => {
      if (!voicesLoaded) {
        const found = pickJapaneseVoice();
        cachedVoice = found;
        resolve(found);
      }
    }, 800);
  });
}

export interface SpeakOptions {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: unknown) => void;
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text || !text.trim()) return;
  const voice = cachedVoice ?? (await ensureVoice());
  // 取消队列里堆积的短句
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.lang = 'ja-JP';
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
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// 预热 voice
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  ensureVoice();
}
