// 生成 numbers 场景的 listening.json
// 听力题设计: 听到一个数字相关日文,选中文意思
// 用法: node scripts/build-numbers-listening.cjs

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCENARIO_DIR = path.join(ROOT, 'public', 'data', 'scenarios', 'numbers');
const WORDS_PATH = path.join(SCENARIO_DIR, 'words.json');
const OUT_PATH = path.join(SCENARIO_DIR, 'listening.json');

// ---- 读 words.json ----
const WORDS = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf-8'));

// ---- 构造听力题 ----
// 模式: 给一个 word, audio=jp, question=中文问"是什么意思?", options 含正确答案 + 3 干扰
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildListening() {
  const out = [];

  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    // 选 3 个干扰项
    const distractors = shuffle(
      WORDS.filter((x) => x.id !== w.id),
    )
      .slice(0, 3)
      .map((d) => d.meaning);

    const options = shuffle([w.meaning, ...distractors]);
    out.push({
      id: `num-l${String(i + 1).padStart(3, '0')}`,
      audio: w.jp,
      question: '听到的词是什么意思?',
      answer: w.meaning,
      options,
      answerIndex: options.indexOf(w.meaning),
      explanation: `${w.jp} = ${w.meaning} (${w.reading})`,
    });
  }

  return out;
}

const listening = buildListening();
fs.writeFileSync(OUT_PATH, JSON.stringify(listening, null, 2) + '\n');
console.log(`✅ listening.json: ${listening.length} 题`);
console.log('   sample:');
console.log(JSON.stringify(listening.slice(0, 2), null, 2));