// Google Cloud Text-to-Speech (chirp3 HD) 批量生成 MP3 静态资源
// 用法:
//   1. 把 .tts-config.json 复制成 .tts-config.json,填入 service account 凭证
//   2. node scripts/generate-tts.cjs         (生成缺失的 mp3)
//   3. node scripts/generate-tts.cjs --force (强制重新生成所有)
//
// 设计要点:
//   - 文件名 = sha1(normalize(text)).slice(0,12) → 内容稳定,文本改了自动重新生成
//   - 已存在的 mp3 自动跳过(可多次运行补充)
//   - 输出 public/audio/{ja,en}/<hash>.mp3,Vite 直接当静态资源
//   - 仅生成数据中出现的文本(扫描 public/data/scenarios/*/words.json)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- 配置 ----
const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, '.tts-config.json');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const SCENARIOS_DIR = path.join(ROOT, 'public', 'data', 'scenarios');
const SCENARIOS_INDEX = path.join(ROOT, 'public', 'data', 'scenarios-index.json');
const TRAFFIC_RULES_WORDS = path.join(ROOT, 'public', 'data', 'traffic-rules', 'words.json');

// chirp3 HD voices - 高质量神经网络语音
const VOICES = {
  ja: 'ja-JP-Chirp3-HD-Charon',  // 日语男声,清晰自然
  en: 'en-US-Chirp3-HD-Charon',  // 英语男声
};
const HASH_LEN = 12;
const FORCE = process.argv.includes('--force');

// ---- 工具 ----
function normalize(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

function hash(text) {
  return crypto.createHash('sha1').update(normalize(text), 'utf8').digest('hex').slice(0, HASH_LEN);
}

function audioPath(lang, h) {
  return path.join(AUDIO_DIR, lang, `${h}.mp3`);
}

function exists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ 找不到配置文件: ${CONFIG_PATH}`);
    console.error(`   请把 scripts/.tts-config.example.json 复制成 .tts-config.json 并填入 service account 凭证。`);
    console.error(`   (为了安全,.tts-config.json 已被 .gitignore 排除)`);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  for (const k of ['project_id', 'client_email', 'private_key']) {
    if (!cfg[k]) {
      console.error(`❌ 配置缺少字段: ${k}`);
      process.exit(1);
    }
  }
  return cfg;
}

// ---- 收集所有需要生成的文本 ----
function collectTexts() {
  const items = []; // { lang, text, hash, scene, wordId }
  const scenes = JSON.parse(fs.readFileSync(SCENARIOS_INDEX, 'utf-8'));

  for (const meta of scenes) {
    const file = meta.id === 'traffic-rules'
      ? TRAFFIC_RULES_WORDS
      : path.join(SCENARIOS_DIR, meta.id, 'words.json');
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    for (const w of data) {
      // 日文 (jp 字段,片假名/汉字/假名都行)
      if (w.jp && w.jp.trim()) {
        items.push({ lang: 'ja', text: w.jp, source: `${meta.id}/${w.id}` });
      }
      // 英文 (en 字段,可空)
      if (w.en && w.en.trim()) {
        items.push({ lang: 'en', text: w.en, source: `${meta.id}/${w.id}` });
      }
    }
  }
  // 去重 (同文本可能多次出现)
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    const h = hash(it.text);
    it.hash = h;
    const key = `${it.lang}:${h}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(it);
  }
  return unique;
}

// ---- Google TTS API 调用 ----
async function synthesize(client, lang, text) {
  const voiceName = VOICES[lang];
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: lang === 'ja' ? 'ja-JP' : 'en-US',
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      // 24kHz 适合单词短音频,体积小 (~3-8KB/词)
      sampleRateHertz: 24000,
      speakingRate: lang === 'ja' ? 0.95 : 1.0,
    },
  });
  return response.audioContent; // Buffer
}

async function main() {
  console.log('🎙  Google Cloud TTS (chirp3 HD) 静态资源生成器\n');

  // 0. 准备目录
  ensureDir(path.join(AUDIO_DIR, 'ja'));
  ensureDir(path.join(AUDIO_DIR, 'en'));

  // 1. 凭证
  const cfg = loadConfig();
  console.log(`✅ 配置加载完成 (project: ${cfg.projectId})\n`);

  // 2. SDK 客户端
  let client;
  try {
    const textToSpeech = require('@google-cloud/text-to-speech');
    client = new textToSpeech.TextToSpeechClient({
      projectId: cfg.projectId,
      credentials: {
        client_email: cfg.client_email,
        private_key: cfg.private_key,
      },
    });
    console.log('✅ TTS 客户端初始化完成\n');
  } catch (e) {
    console.error('❌ @google-cloud/text-to-speech 未安装,先跑:');
    console.error('   npm install --save-dev @google-cloud/text-to-speech');
    process.exit(1);
  }

  // 3. 收集文本
  const items = collectTexts();
  const stats = { ja: { total: 0, exists: 0, created: 0, failed: 0 }, en: { total: 0, exists: 0, created: 0, failed: 0 } };
  for (const it of items) stats[it.lang].total++;

  console.log(`📋 共 ${items.length} 个文本 (ja: ${stats.ja.total}, en: ${stats.en.total})\n`);

  // 4. 逐个处理
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const out = audioPath(it.lang, it.hash);
    const tag = `[${i + 1}/${items.length}]`;

    if (!FORCE && exists(out)) {
      stats[it.lang].exists++;
      continue;
    }

    try {
      const buf = await synthesize(client, it.lang, it.text);
      fs.writeFileSync(out, buf);
      stats[it.lang].created++;
      const size = (buf.length / 1024).toFixed(1);
      process.stdout.write(`${tag} ✓ ${it.lang}/${it.hash}.mp3  (${size}KB)  "${it.text.slice(0, 30)}"  [${it.source}]\n`);
    } catch (e) {
      stats[it.lang].failed++;
      process.stdout.write(`${tag} ✗ ${it.lang} 失败: ${it.text.slice(0, 30)}  (${e.message})\n`);
    }

    // 礼貌:每秒最多 5 次避免触发配额
    await new Promise((r) => setTimeout(r, 100));
  }

  // 5. 总结
  console.log('\n────── 完成 ──────');
  for (const lang of ['ja', 'en']) {
    const s = stats[lang];
    console.log(`  ${lang}: ${s.total} 文本 · 已存在 ${s.exists} · 新生成 ${s.created} · 失败 ${s.failed}`);
  }
  const totalCreated = stats.ja.created + stats.en.created;
  const totalFailed = stats.ja.failed + stats.en.failed;
  console.log(`\n总共新生成 ${totalCreated} 个 mp3${totalFailed > 0 ? `, 失败 ${totalFailed} 个` : ''}`);
  console.log(`路径: public/audio/{ja,en}/<hash>.mp3  (Vite 静态资源)`);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
