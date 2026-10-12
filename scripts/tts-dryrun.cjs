// dry-run: 不调用 TTS,只看会扫到多少文本、按什么来源分布
// 用法: node scripts/tts-dryrun.cjs

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SCENARIOS_DIR = path.join(ROOT, 'public', 'data', 'scenarios');
const SCENARIOS_INDEX = path.join(ROOT, 'public', 'data', 'scenarios-index.json');
const TRAFFIC_RULES_WORDS = path.join(ROOT, 'public', 'data', 'traffic-rules', 'words.json');

function collectBySource() {
  const byScene = {};
  const scenes = JSON.parse(fs.readFileSync(SCENARIOS_INDEX, 'utf-8'));
  for (const meta of scenes) {
    const baseDir = meta.id === 'traffic-rules'
      ? path.join(ROOT, 'public', 'data', 'traffic-rules')
      : path.join(SCENARIOS_DIR, meta.id);

    byScene[meta.id] = { jp: 0, en: 0, grammar: 0, dialog: 0, listening: 0, quiz: 0 };

    // words
    const wordsFile = path.join(baseDir, 'words.json');
    if (fs.existsSync(wordsFile)) {
      const words = JSON.parse(fs.readFileSync(wordsFile, 'utf-8'));
      for (const w of words) {
        if (w.jp?.trim()) byScene[meta.id].jp++;
        if (w.en?.trim()) byScene[meta.id].en++;
      }
    }
    // grammar
    const gf = path.join(baseDir, 'grammar.json');
    if (fs.existsSync(gf)) {
      const grammar = JSON.parse(fs.readFileSync(gf, 'utf-8'));
      for (const g of grammar) {
        for (const ex of (g.examples || [])) {
          if (ex.jp?.trim()) byScene[meta.id].grammar++;
        }
      }
    }
    // dialogs
    const df = path.join(baseDir, 'dialogs.json');
    if (fs.existsSync(df)) {
      const dialogs = JSON.parse(fs.readFileSync(df, 'utf-8'));
      for (const d of dialogs) {
        for (const line of (d.lines || [])) {
          if (line.jp?.trim()) byScene[meta.id].dialog++;
        }
      }
    }
    // listening
    const lf = path.join(baseDir, 'listening.json');
    if (fs.existsSync(lf)) {
      const items = JSON.parse(fs.readFileSync(lf, 'utf-8'));
      for (const it of items) if (it.audio?.trim()) byScene[meta.id].listening++;
    }
    // quiz
    const qf = path.join(baseDir, 'quiz.json');
    if (fs.existsSync(qf)) {
      const items = JSON.parse(fs.readFileSync(qf, 'utf-8'));
      for (const q of items) {
        if ((q.type === 'listening' || q.type === 'response' || q.type === 'spell-audio') && q.audio?.trim()) {
          byScene[meta.id].quiz++;
        } else if (q.type === 'spelling' && q.prompt?.trim()) {
          byScene[meta.id].quiz++;
        }
      }
    }
  }
  return byScene;
}

const data = collectBySource();
let total = 0;
console.log('TTS 扫描统计 (dry-run,未生成任何文件)\n');
console.log('场景                  jp_words  en_words  grammar_ex  dialog_line  listening  quiz  总计');
console.log('─'.repeat(90));
for (const [scene, c] of Object.entries(data)) {
  const sum = c.jp + c.en + c.grammar + c.dialog + c.listening + c.quiz;
  total += sum;
  console.log(
    `${scene.padEnd(20)}  ${String(c.jp).padStart(7)}  ${String(c.en).padStart(8)}  ${String(c.grammar).padStart(9)}  ${String(c.dialog).padStart(11)}  ${String(c.listening).padStart(9)}  ${String(c.quiz).padStart(4)}  ${String(sum).padStart(5)}`,
  );
}
console.log('─'.repeat(90));
console.log(`${'总计'.padEnd(20)}  ${' '.repeat(7)}  ${' '.repeat(8)}  ${' '.repeat(9)}  ${' '.repeat(11)}  ${' '.repeat(9)}  ${' '.repeat(4)}  ${String(total).padStart(5)}`);
console.log(`\n(去重后会更少,比如「ハンドル」在 driving/course-practice/road-test 都出现,只生成 1 次)`);