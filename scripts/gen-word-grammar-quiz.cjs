// 给每个场景的 words.json + grammar.json 派生大量小测题
// 每个 word 生成 4-5 道题,每个 grammar 生成 2-3 道题
// 类型:复用现有 type(choice/listening/spelling/spell-audio),不引入新 type
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public', 'data', 'scenarios');
// 包含 traffic-rules(虽然它有 350 truefalse,但 traffic-rules 没 words/grammar 词库在 scenarios-index)
const TARGETS = ['driving', 'enrollment', 'course-practice', 'road-test', 'signs-rules', 'medical', 'pregnancy', 'it-work'];
// traffic-rules 直接放 public/data/ 老的格式,跳过

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickN(arr, n, exclude = new Set()) {
  const pool = arr.map((_, i) => i).filter((i) => !exclude.has(i));
  const out = [];
  for (let k = 0; k < n && pool.length; k++) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(arr[i]);
    pool.splice(i, 1);
  }
  return out;
}

function buildWrongs(words, correct, field, n = 3) {
  const wrongs = [];
  const seen = new Set([correct[field]]);
  const candidates = shuffle(words);
  for (const w of candidates) {
    if (wrongs.length >= n) break;
    if (w.id === correct.id) continue;
    const v = w[field];
    if (v && !seen.has(v)) {
      seen.add(v);
      wrongs.push(v);
    }
  }
  // 不够的话填空字符串
  while (wrongs.length < n) wrongs.push(`(干扰项 ${wrongs.length + 1})`);
  return wrongs;
}

function buildWordQuiz(words, w, idPrefix) {
  // 必须有 jp + reading + meaning 才出题
  if (!w.jp || !w.reading || !w.meaning) return [];
  const out = [];
  const num = (n) => String(n).padStart(3, '0');

  // 1) 看 jp(kji) → 选中文意思(4 选 1)
  const wrongs1 = buildWrongs(words, w, 'meaning', 3);
  const opts1 = shuffle([w.meaning, ...wrongs1]);
  out.push({
    id: `${idPrefix}-w1-${num(0)}`,
    type: 'choice',
    question: `${w.jp} 是什么意思?`,
    options: opts1,
    answerIndex: opts1.indexOf(w.meaning),
    explanation: `${w.jp}(${w.reading}) = ${w.meaning}`,
  });

  // 2) 听 jp(kji) → 选中文意思
  const wrongs2 = buildWrongs(words, w, 'meaning', 3);
  const opts2 = shuffle([w.meaning, ...wrongs2]);
  out.push({
    id: `${idPrefix}-w2-${num(0)}`,
    type: 'listening',
    question: '听到的词是什么意思?',
    audio: w.jp,
    options: opts2,
    answerIndex: opts2.indexOf(w.meaning),
    explanation: `${w.jp}(${w.reading}) = ${w.meaning}`,
  });

  // 3) 看中文 → 选日文(4 选 1,显示 kanji 选项)
  const wrongs3 = buildWrongs(words, w, 'jp', 3);
  const opts3 = shuffle([w.jp, ...wrongs3]);
  out.push({
    id: `${idPrefix}-w3-${num(0)}`,
    type: 'choice',
    question: `${w.meaning} 用日语怎么说?`,
    options: opts3,
    answerIndex: opts3.indexOf(w.jp),
    explanation: `${w.jp}(${w.reading}) = ${w.meaning}`,
  });

  // 4) 看 kanji → 选假名(4 选 1,显示假名选项)
  const wrongs4 = buildWrongs(words, w, 'reading', 3);
  const opts4 = shuffle([w.reading, ...wrongs4]);
  out.push({
    id: `${idPrefix}-w4-${num(0)}`,
    type: 'choice',
    question: `${w.jp} 的读音是?`,
    options: opts4,
    answerIndex: opts4.indexOf(w.reading),
    explanation: `${w.jp} = ${w.reading}(${w.meaning})`,
  });

  // 5) 看 kanji → 写假名(spelling)
  out.push({
    id: `${idPrefix}-w5-${num(0)}`,
    type: 'spelling',
    question: '请写出读音(假名)',
    prompt: w.jp,
    answer: `${w.reading}|${w.romaji ?? ''}`,
    answerFormat: 'hiragana',
    explanation: `${w.jp} = ${w.reading}(${w.meaning})`,
  });

  // 6) 听 kanji → 写假名(spell-audio)
  out.push({
    id: `${idPrefix}-w6-${num(0)}`,
    type: 'spell-audio',
    question: '听音频,写出假名',
    audio: w.jp,
    answer: `${w.reading}|${w.romaji ?? ''}`,
    answerFormat: 'hiragana',
    explanation: `${w.jp} = ${w.reading}(${w.meaning})`,
  });

  return out;
}

function buildGrammarQuiz(grammars, g, idPrefix) {
  // 必须有 pattern + meaning + 至少 1 example
  if (!g.pattern || !g.meaning) return [];
  const out = [];
  const num = (n) => String(n).padStart(3, '0');

  // 1) 看语法 → 选意思
  const wrongs1 = buildWrongs(grammars, g, 'meaning', 3);
  const opts1 = shuffle([g.meaning, ...wrongs1]);
  out.push({
    id: `${idPrefix}-g1-${num(0)}`,
    type: 'choice',
    question: `语法「${g.pattern}」的意思是?`,
    options: opts1,
    answerIndex: opts1.indexOf(g.meaning),
    explanation: g.examples?.[0] ? `${g.examples[0].jp} = ${g.examples[0].meaning}` : `${g.pattern} = ${g.meaning}`,
  });

  // 2) 看意思 → 选语法 pattern
  const wrongs2 = buildWrongs(grammars, g, 'pattern', 3);
  const opts2 = shuffle([g.pattern, ...wrongs2]);
  out.push({
    id: `${idPrefix}-g2-${num(0)}`,
    type: 'choice',
    question: `意思「${g.meaning}」对应哪个语法?`,
    options: opts2,
    answerIndex: opts2.indexOf(g.pattern),
    explanation: `${g.pattern} = ${g.meaning}`,
  });

  return out;
}

let totalAdded = 0;
for (const id of TARGETS) {
  const dir = path.join(ROOT, id);
  if (!fs.existsSync(dir)) continue;
  const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
  const grammars = JSON.parse(fs.readFileSync(path.join(dir, 'grammar.json'), 'utf8'));
  const quiz = JSON.parse(fs.readFileSync(path.join(dir, 'quiz.json'), 'utf8'));
  const existingIds = new Set(quiz.map((q) => q.id));

  // 为每个 word 生成题(每个 word 6 道题)
  let added = 0;
  for (const w of words) {
    const newQs = buildWordQuiz(words, w, `${id}-${w.id}`);
    for (const q of newQs) {
      if (existingIds.has(q.id)) continue;
      quiz.push(q);
      existingIds.add(q.id);
      added++;
    }
  }
  // 为每个 grammar 生成题
  for (const g of grammars) {
    const newQs = buildGrammarQuiz(grammars, g, `${id}-${g.id}`);
    for (const q of newQs) {
      if (existingIds.has(q.id)) continue;
      quiz.push(q);
      existingIds.add(q.id);
      added++;
    }
  }
  fs.writeFileSync(path.join(dir, 'quiz.json'), JSON.stringify(quiz, null, 2) + '\n', 'utf8');
  const stats = quiz.reduce((acc, q) => {
    acc[q.type || 'choice'] = (acc[q.type || 'choice'] || 0) + 1;
    return acc;
  }, {});
  console.log(`[${id}] +${added} 题,共 ${quiz.length} 题 → ${JSON.stringify(stats)}`);
  totalAdded += added;
}
console.log(`\n总计 +${totalAdded} 题`);
