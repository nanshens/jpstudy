// Google Cloud Text-to-Speech (chirp3 HD) 批量生成 MP3 静态资源
// 用法:
//   1. 把 .tts-config.example.json 复制成 .tts-config.json,填入 service account 凭证
//   2. node scripts/generate-tts.cjs         (生成缺失的 mp3)
//   3. node scripts/generate-tts.cjs --force (强制重新生成所有)
//
// 扫描的数据字段:
//   words.*.jp        - 单词日文 (含片假名/汉字)
//   words.*.en        - 单词英文 (如果有)
//   grammar.*.examples[].jp - 语法例句
//   dialogs.*.lines[].jp   - 对话每行
//   listening.*.audio      - 听力题日文题干
//   quiz[].audio|prompt    - 听力/拼写题日的文
//
// 设计要点:
//   - 文件名 = sha1(normalize(text)).slice(0,12) → 内容稳定,文本改了自动重新生成
//   - 已存在的 mp3 自动跳过(可多次运行补充)
//   - 输出 public/audio/{ja,en}/<hash>.mp3,Vite 直接当静态资源
//   - 去重:同一文本(同 lang + 同 hash)只生成一份

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

const VOICES = {
  ja: 'ja-JP-Chirp3-HD-Charon',
  en: 'en-US-Chirp3-HD-Charon',
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
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ 找不到配置文件: ${CONFIG_PATH}`);
    console.error(`   请把 scripts/.tts-config.example.json 复制成 .tts-config.json 并填入 service account 凭证。`);
    console.error(`   (为了安全,.tts-config.json 已被 .gitignore 排除)`);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  for (const k of ['project_id', 'client_email', 'private_key']) {
    if (!cfg[k]) { console.error(`❌ 配置缺少字段: ${k}`); process.exit(1); }
  }
  return cfg;
}

// ---- 收集文本 ----
// 每项 = { lang, text, source }
// source 用于日志显示来源 (e.g. "medical/word:w-hospital", "medical/dialog:med-d01/line:0")
function collectTexts() {
  const raw = []; // 收集前
  const scenes = JSON.parse(fs.readFileSync(SCENARIOS_INDEX, 'utf-8'));

  for (const meta of scenes) {
    const baseDir = meta.id === 'traffic-rules'
      ? path.join(ROOT, 'public', 'data', 'traffic-rules')
      : path.join(SCENARIOS_DIR, meta.id);

    // 1. words.json - jp + en
    const wordsFile = path.join(baseDir, 'words.json');
    if (fs.existsSync(wordsFile)) {
      const words = JSON.parse(fs.readFileSync(wordsFile, 'utf-8'));
      for (const w of words) {
        if (w.jp && w.jp.trim()) {
          raw.push({ lang: 'ja', text: w.jp, source: `${meta.id}/word:${w.id}` });
        }
        if (w.en && w.en.trim()) {
          raw.push({ lang: 'en', text: w.en, source: `${meta.id}/word:${w.id}` });
        }
      }
    }

    // 2. grammar.json - examples[].jp
    const grammarFile = path.join(baseDir, 'grammar.json');
    if (fs.existsSync(grammarFile)) {
      const grammar = JSON.parse(fs.readFileSync(grammarFile, 'utf-8'));
      for (const g of grammar) {
        for (let i = 0; i < (g.examples || []).length; i++) {
          const ex = g.examples[i];
          if (ex.jp && ex.jp.trim()) {
            raw.push({ lang: 'ja', text: ex.jp, source: `${meta.id}/grammar:${g.id}/ex:${i}` });
          }
        }
      }
    }

    // 3. dialogs.json - lines[].jp
    const dialogsFile = path.join(baseDir, 'dialogs.json');
    if (fs.existsSync(dialogsFile)) {
      const dialogs = JSON.parse(fs.readFileSync(dialogsFile, 'utf-8'));
      for (const d of dialogs) {
        for (let i = 0; i < (d.lines || []).length; i++) {
          const line = d.lines[i];
          if (line.jp && line.jp.trim()) {
            raw.push({ lang: 'ja', text: line.jp, source: `${meta.id}/dialog:${d.id}/line:${i}` });
          }
        }
      }
    }

    // 4. listening.json - audio (题干日文)
    const listeningFile = path.join(baseDir, 'listening.json');
    if (fs.existsSync(listeningFile)) {
      const items = JSON.parse(fs.readFileSync(listeningFile, 'utf-8'));
      for (const it of items) {
        if (it.audio && it.audio.trim()) {
          raw.push({ lang: 'ja', text: it.audio, source: `${meta.id}/listening:${it.id}` });
        }
      }
    }

    // 5. quiz.json - 听力/拼写题日文
    const quizFile = path.join(baseDir, 'quiz.json');
    if (fs.existsSync(quizFile)) {
      const items = JSON.parse(fs.readFileSync(quizFile, 'utf-8'));
      for (const q of items) {
        // listening / response / spell-audio 题型用 audio 字段
        if ((q.type === 'listening' || q.type === 'response' || q.type === 'spell-audio') && q.audio && q.audio.trim()) {
          raw.push({ lang: 'ja', text: q.audio, source: `${meta.id}/quiz:${q.id}` });
        }
        // spelling 题型用 prompt 字段
        if (q.type === 'spelling' && q.prompt && q.prompt.trim()) {
          raw.push({ lang: 'ja', text: q.prompt, source: `${meta.id}/quiz:${q.id}` });
        }
      }
    }
  }

  // 去重 + 加 hash
  const seen = new Set();
  const items = [];
  const dupCount = raw.length;
  for (const it of raw) {
    const h = hash(it.text);
    const key = `${it.lang}:${h}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ ...it, hash: h });
  }
  return { items, totalRaw: raw.length, unique: items.length, deduped: dupCount - items.length };
}

// ---- Google TTS ----
async function synthesize(client, lang, text) {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: lang === 'ja' ? 'ja-JP' : 'en-US',
      name: VOICES[lang],
    },
    audioConfig: {
      audioEncoding: 'MP3',
      sampleRateHertz: 24000,
      speakingRate: lang === 'ja' ? 0.95 : 1.0,
    },
  });
  return response.audioContent;
}

async function main() {
  console.log('🎙  Google Cloud TTS (chirp3 HD) 静态资源生成器\n');

  ensureDir(path.join(AUDIO_DIR, 'ja'));
  ensureDir(path.join(AUDIO_DIR, 'en'));

  const cfg = loadConfig();
  console.log(`✅ 配置加载完成 (project: ${cfg.projectId})\n`);

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

  const { items, totalRaw, unique, deduped } = collectTexts();
  const stats = {
    ja: { total: 0, exists: 0, created: 0, failed: 0 },
    en: { total: 0, exists: 0, created: 0, failed: 0 },
  };
  for (const it of items) stats[it.lang].total++;

  console.log(`📋 扫描到 ${totalRaw} 个文本(去重后 ${unique},节省 ${deduped} 个 API 调用)`);
  console.log(`   ja: ${stats.ja.total}, en: ${stats.en.total}\n`);

  let consecutiveFails = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const out = audioPath(it.lang, it.hash);
    const tag = `[${String(i + 1).padStart(3, ' ')}/${items.length}]`;

    if (!FORCE && exists(out)) {
      stats[it.lang].exists++;
      continue;
    }

    try {
      const buf = await synthesize(client, it.lang, it.text);
      fs.writeFileSync(out, buf);
      stats[it.lang].created++;
      consecutiveFails = 0;
      const size = (buf.length / 1024).toFixed(1);
      process.stdout.write(`${tag} ✓ ${it.lang}/${it.hash}.mp3  (${size}KB)  "${it.text.slice(0, 40).replace(/\n/g, ' ')}"  [${it.source}]\n`);
    } catch (e) {
      stats[it.lang].failed++;
      consecutiveFails++;
      process.stdout.write(`${tag} ✗ ${it.lang} 失败: "${it.text.slice(0, 30)}"  (${e.message?.slice(0, 80)})\n`);
      if (consecutiveFails >= 5) {
        console.error('\n连续 5 次失败,可能是凭证或配额问题,中止。');
        break;
      }
    }

    // 礼貌:每秒最多 5 次避免触发配额
    await new Promise((r) => setTimeout(r, 200));
  }

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
