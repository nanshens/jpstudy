// 解析「新编日语教程第一册」4 个 markdown 资源,生成 N5 场景的所有数据文件
// 用法: node scripts/build-textbook-scenario.cjs

const fs = require('fs');
const path = require('path');

const ASSETS = path.join('C:\\Users\\nanshens\\.minimax\\v2\\assets\\2026\\10\\12');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'data', 'scenarios', 'textbook-n5');
const INDEX_PATH = path.join(ROOT, 'public', 'data', 'scenarios-index.json');

const FILES = {
  vocab: '20-02-38-467-asset_20261012-200238-467_118c31a6a147_d5ebc1e2-新编日语教程第一册_单词.md',
  grammar: '20-02-38-481-asset_20261012-200238-481_5563dfa2af61_b23a992a-新编日语教程第一册_语法.md',
  dialogs: '20-02-38-477-asset_20261012-200238-477_676accfa60c5_6802e432-新编日语教程第一册_文章.md',
  phrases: '20-02-38-473-asset_20261012-200238-473_26085ee49a48_7f5ef9c9-新编日语教程第一册_短句.md',
};

// ---- 通用工具 ----
function readMD(name) {
  return fs.readFileSync(path.join(ASSETS, name), 'utf-8');
}
function splitLessons(md, header = '## 第') {
  const lines = md.split('\n');
  const lessons = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^## 第(\d+)課\s*(.+)?$/);
    if (m) {
      if (cur) lessons.push(cur);
      cur = { num: +m[1], title: (m[2] || '').trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) lessons.push(cur);
  return lessons;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Romaji 简化生成 ----
const KANA_TO_ROMAJI = {
  'あ':'a','い':'i','う':'u','え':'e','お':'o',
  'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
  'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya','ゆ':'yu','よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa','を':'wo','ん':'n',
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja','じゅ':'ju','じょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  'っ':'','ー':'','・':'',
};
function katakanaToHiragana(s) {
  let out = '';
  for (const c of s) {
    const code = c.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60);
    else out += c;
  }
  return out;
}
function romajiOf(reading) {
  let s = katakanaToHiragana(reading || '');
  s = s.replace(/きゃ/g,'kya').replace(/きゅ/g,'kyu').replace(/きょ/g,'kyo');
  s = s.replace(/しゃ/g,'sha').replace(/しゅ/g,'shu').replace(/しょ/g,'sho');
  s = s.replace(/ちゃ/g,'cha').replace(/ちゅ/g,'chu').replace(/ちょ/g,'cho');
  s = s.replace(/にゃ/g,'nya').replace(/にゅ/g,'nyu').replace(/にょ/g,'nyo');
  s = s.replace(/ひゃ/g,'hya').replace(/ひゅ/g,'hyu').replace(/ひょ/g,'hyo');
  s = s.replace(/みゃ/g,'mya').replace(/みゅ/g,'myu').replace(/みょ/g,'myo');
  s = s.replace(/りゃ/g,'rya').replace(/りゅ/g,'ryu').replace(/りょ/g,'ryo');
  s = s.replace(/ぎゃ/g,'gya').replace(/ぎゅ/g,'gyu').replace(/ぎょ/g,'gyo');
  s = s.replace(/じゃ/g,'ja').replace(/じゅ/g,'ju').replace(/じょ/g,'jo');
  s = s.replace(/びゃ/g,'bya').replace(/びゅ/g,'byu').replace(/びょ/g,'byo');
  s = s.replace(/ぴゃ/g,'pya').replace(/ぴゅ/g,'pyu').replace(/ぴょ/g,'pyo');
  let out = '';
  for (let i = 0; i < s.length; i++) out += KANA_TO_ROMAJI[s[i]] ?? s[i];
  return out.toLowerCase();
}

// 标记 symbol 转纯文本 (○0 → [0], ② → [2])
function cleanAccent(s) {
  if (!s) return '';
  return s.replace(/[○◎]/g, '[0]').replace(/[①②③④⑤⑥⑦⑧⑨⑪⑫⑬]/g, (m) => `[${m.charCodeAt(0) - 0x245F}]`);
}

// 解析一行表格 (| a | b | c | d | e |),返回字段数组
function parseTableRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

// 提取 lesson 内所有的表格行(过滤非表格行)
function extractTableRows(lines) {
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (/^\|.*\|$/.test(line)) {
      // 表格分隔行 |---|---|---|---|
      if (/^\|[\s\-:|]+\|$/.test(line)) { inTable = true; continue; }
      if (!inTable) continue; // 表头前的列计数也要,这里直接收
      rows.push(parseTableRow(line));
    } else {
      inTable = false;
    }
  }
  return rows;
}

// ================================================================
// 1. 单词 vocab
// ================================================================
function parseVocab(md) {
  const lessons = splitLessons(md);
  const all = [];
  for (const lesson of lessons) {
    const section = lesson.lines.join('\n');
    const rows = extractTableRows(section.split('\n'));
    // 跳过表头 + 表分隔
    const dataRows = rows.slice(2);
    // 不同表可能不同列数: 基础语音课是 4 列, 主课是 5 列
    for (const row of dataRows) {
      if (row.length < 3) continue;
      // 列识别: 5 列 = [单词, 读音, 声调, 词性, 中文]
      // 4 列 = [假名, 声调, 日文汉字, 中文]
      let jp, reading, accent, meaning, pos;
      if (row.length >= 5) {
        jp = row[0]; reading = row[1]; accent = row[2]; pos = row[3]; meaning = row[4];
      } else if (row.length === 4) {
        jp = row[0]; accent = row[1]; reading = row[2]; meaning = row[3];
      } else {
        continue;
      }
      // jp 是单词本身 (汉字或外来语片假名);reading 是假名;accent 是声调
      if (!jp || !meaning) continue;
      all.push({
        jp, reading: reading || jp, accent, pos, meaning,
        lesson: lesson.num, lessonTitle: lesson.title,
      });
    }
  }
  return all;
}

// ================================================================
// 2. 语法 grammar
// ================================================================
function parseGrammar(md) {
  const lessons = splitLessons(md);
  const out = [];
  for (const lesson of lessons) {
    let curEntry = null;
    for (const line of lesson.lines) {
      // 新句型标题: ### N. 句型
      const entryHead = line.match(/^### (\d+)\.\s*(.+)$/);
      if (entryHead) {
        if (curEntry) out.push(curEntry);
        curEntry = {
          id: `g${lesson.num}-${entryHead[1]}`,
          lesson: lesson.num,
          lessonTitle: lesson.title,
          title: entryHead[2].trim(),
          pattern: '',
          explanation: '',
          examples: [],
          note: '',
        };
        continue;
      }
      if (!curEntry) continue;
      // 句型行: - **〜は〜です** ...
      const patternMatch = line.match(/^- \*\*(.+?)\*\*/);
      if (patternMatch) {
        curEntry.pattern = patternMatch[1];
        // 句型后面的说明紧跟同一行
        curEntry.explanation = line.replace(/^- \*\*.+?\*\*[:\s]*/, '').trim();
        continue;
      }
      // 例子: - わたしは学生です。／我是学生。 (单行也可能多组以 ／ 分隔)
      const exMatch = line.match(/^- (.+)$/);
      if (exMatch) {
        const body = exMatch[1];
        // 检测: 同时含 ／ 或 / 分隔 → 多例子
        if (/[／\/]/.test(body)) {
          const parts = body.split(/[／\/]/).map((p) => p.trim()).filter(Boolean);
          // 第一段可能是 "例：..." 前缀,剥掉
          const pairs = [];
          for (let i = 0; i + 1 < parts.length; i += 2) {
            const jp = parts[i].replace(/^例[:：]\s*/, '');
            const meaning = parts[i + 1];
            pairs.push({ jp, reading: '', meaning });
          }
          if (pairs.length === 0) {
            // 奇数段无法配对,作为 explanation
            if (curEntry.explanation) curEntry.explanation += '\n' + body;
            else curEntry.explanation = body;
          } else {
            for (const p of pairs) curEntry.examples.push(p);
          }
        } else {
          // 普通说明行(无 ／),作为 explanation
          if (curEntry.explanation) curEntry.explanation += '\n' + body;
          else curEntry.explanation = body;
        }
        continue;
      }
      // 纯说明行 / 备注: 接续解释
      if (line.startsWith('- ')) {
        const txt = line.slice(2).trim();
        if (curEntry.explanation) {
          curEntry.explanation += '\n' + txt;
        } else {
          curEntry.explanation = txt;
        }
      } else if (line.startsWith('### ') && /应用/.test(line)) {
        // 切到"应用语"section, 说明整段接进 explanation
        curEntry.note += (curEntry.note ? '\n' : '') + line.slice(4).trim();
      }
    }
    if (curEntry) out.push(curEntry);
  }
  // 后处理: examples 里的 reading 用 romajiOf 简单生成;清掉 jp 末尾的中文括号注释
  for (const g of out) {
    for (const ex of g.examples) {
      // 移除 jp 末尾的(中文注释)
      ex.jp = ex.jp.replace(/\s*[（(][\u4e00-\u9fff][^）)]*[）)]\s*$/, '').trim();
      ex.reading = romajiOf(ex.jp);
    }
  }
  return out;
}

// ================================================================
// 3. 对话 dialogs
// ================================================================
function parseDialogs(md) {
  const lessons = splitLessons(md);
  const out = [];
  for (const lesson of lessons) {
    const dialog = { id: `n5-d${lesson.num}`, lesson: lesson.num, title: lesson.title, scene: '', lines: [] };
    let pendingJP = null;
    let pendingSpeaker = null;
    let lineIdx = 0;
    for (const line of lesson.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // 角色行: 角色名：日文
      const sp = trimmed.match(/^([^：\s]+?)[:：]\s*(.+)$/);
      if (sp && /[ぁ-んァ-ン一-鿿]/.test(sp[2])) {
        pendingSpeaker = sp[1].trim();
        pendingJP = sp[2].trim();
        continue;
      }
      // 中文翻译行 (无 speaker, 紧跟日文后)
      if (pendingJP && /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef、，。！？]/.test(trimmed)) {
        dialog.lines.push({
          speaker: pendingSpeaker,
          jp: pendingJP,
          reading: '',
          meaning: trimmed.replace(/\s*\/\s*/g, ''),
        });
        pendingJP = null;
        pendingSpeaker = null;
        lineIdx++;
        continue;
      }
      // 旁白 (括号): 解释场景
      const narration = trimmed.match(/^[（(](.+)[)）]$/);
      if (narration) {
        dialog.scene = narration[1];
        continue;
      }
    }
    if (dialog.lines.length > 0) out.push(dialog);
  }
  return out;
}

// ================================================================
// 4. 短句 phrases (用于补 grammar examples 和 dialogs)
// ================================================================
function parsePhrases(md) {
  const lessons = splitLessons(md);
  const out = [];
  for (const lesson of lessons) {
    const items = [];
    for (const line of lesson.lines) {
      // 寒暄语表 (| 日文 | 中文 | 使用场景 |)
      if (/^\|.*\|.*\|$/.test(line) && !/^\|[\s\-:|]+\|$/.test(line)) {
        const row = parseTableRow(line);
        if (row.length >= 2) items.push({ jp: row[0], reading: '', meaning: row[1] });
      }
      // 句型例句: 日文／中文
      const ex = line.match(/^- (.+?)\s*\/[／/]\s*(.+)$/);
      if (ex) items.push({ jp: ex[1].trim(), reading: '', meaning: ex[2].trim() });
    }
    if (items.length > 0) out.push({ lesson: lesson.num, title: lesson.title, items });
  }
  return out;
}

// ================================================================
// 数据规范化
// ================================================================
function makeRomaji(reading) {
  return romajiOf(reading);
}

function buildWords(vocabRaw) {
  // 去重 + 转 WordEntry 格式
  const seen = new Set();
  const out = [];
  let i = 0;
  for (const v of vocabRaw) {
    if (!v.jp || !v.meaning) continue;
    const key = v.jp + '|' + v.meaning;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `n5-w${String(++i).padStart(4, '0')}`,
      jp: v.jp,
      reading: v.reading || v.jp,
      romaji: makeRomaji(v.reading || v.jp),
      meaning: v.meaning,
      accent: v.accent,
      tag: ['N5', `第${v.lesson}課`, v.pos].filter(Boolean),
      lesson: v.lesson,
      note: v.pos ? `[${v.pos}]` : '',
    });
  }
  return out;
}

function buildGrammarEntries(grammarRaw) {
  return grammarRaw.map((g, i) => ({
    id: g.id || `g-${i}`,
    title: g.title,
    pattern: g.pattern,
    explanation: g.explanation,
    examples: g.examples.slice(0, 5),
    note: g.note || `第${g.lesson}課`,
  }));
}

function buildDialogs(dialogsRaw) {
  // 给 lines 加 reading
  return dialogsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    scene: d.scene,
    lines: d.lines.map((l) => ({ ...l, reading: makeRomaji(l.jp) })),
  }));
}

// ================================================================
// Quiz / Listening 派生
// ================================================================
function buildQuiz(words, dialogs) {
  const byTag = {};
  for (const w of words) {
    const t = `第${w.lesson}課`;
    (byTag[t] ??= []).push(w);
  }
  const out = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const tag = `第${w.lesson}課`;
    const distractors = shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3);

    // 1) 看汉字选意思
    {
      const opts = shuffle([w.meaning, ...distractors.map((d) => d.meaning)]);
      out.push({
        id: `${w.id}-c1`,
        type: 'choice',
        question: `「${w.jp}」是什么意思?`,
        options: opts,
        answerIndex: opts.indexOf(w.meaning),
        explanation: `${w.jp} = ${w.meaning} (${w.reading})`,
      });
    }
    // 2) 听选意思
    {
      const opts = shuffle([w.meaning, ...distractors.map((d) => d.meaning)]);
      out.push({
        id: `${w.id}-l1`,
        type: 'listening',
        audio: w.jp,
        question: '听到的词是什么意思?',
        options: opts,
        answerIndex: opts.indexOf(w.meaning),
        explanation: `${w.jp} = ${w.meaning}`,
      });
    }
    // 3) 看中文选日文
    {
      const opts = shuffle([w.jp, ...distractors.map((d) => d.jp)]);
      out.push({
        id: `${w.id}-c2`,
        type: 'choice',
        question: `「${w.meaning}」的日文是?`,
        options: opts,
        answerIndex: opts.indexOf(w.jp),
        explanation: `${w.meaning} = ${w.jp} (${w.reading})`,
      });
    }
    // 4) 看汉字选假名
    {
      const opts = shuffle([w.reading, ...distractors.map((d) => d.reading)]);
      out.push({
        id: `${w.id}-c3`,
        type: 'choice',
        question: `「${w.jp}」的读音是?`,
        options: opts,
        answerIndex: opts.indexOf(w.reading),
        explanation: `${w.jp} = ${w.reading}`,
      });
    }
    // 5) 看汉字写假名
    out.push({
      id: `${w.id}-s1`,
      type: 'spelling',
      prompt: w.jp,
      question: '请写出读音(假名)',
      answer: w.reading,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
    // 6) 听写假名
    out.push({
      id: `${w.id}-sa1`,
      type: 'spell-audio',
      audio: w.jp,
      question: '听音频,写出假名',
      answer: w.reading,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
  }

  // 从 dialogs 派生对话听力题
  for (const d of dialogs) {
    for (let i = 0; i < d.lines.length; i++) {
      const line = d.lines[i];
      const distractors = shuffle(d.lines.filter((l) => l.jp !== line.jp)).slice(0, 3);
      const opts = shuffle([line.meaning, ...distractors.map((l) => l.meaning)]);
      out.push({
        id: `${d.id}-l${i + 1}`,
        type: 'listening',
        audio: line.jp,
        question: `「${d.title}」中的句子是什么意思?`,
        options: opts,
        answerIndex: opts.indexOf(line.meaning),
        explanation: `${line.speaker}: ${line.jp} = ${line.meaning}`,
      });
    }
  }

  return out;
}

function buildListening(words, dialogs) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const distractors = shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3);
    const opts = shuffle([w.meaning, ...distractors.map((d) => d.meaning)]);
    out.push({
      id: `n5-l${String(i + 1).padStart(4, '0')}`,
      audio: w.jp,
      question: '听到的词是什么意思?',
      answer: w.meaning,
      options: opts,
      answerIndex: opts.indexOf(w.meaning),
      explanation: `${w.jp} = ${w.meaning} (${w.reading})`,
    });
  }
  // 对话听力 (sample 一些, 不全展开)
  for (const d of dialogs) {
    for (let i = 0; i < Math.min(d.lines.length, 6); i++) {
      const line = d.lines[i];
      const distractors = shuffle(d.lines.filter((l) => l.jp !== line.jp)).slice(0, 3);
      const opts = shuffle([line.meaning, ...distractors.map((l) => l.meaning)]);
      out.push({
        id: `${d.id}-L${i + 1}`,
        audio: line.jp,
        question: `「${d.title}」${line.speaker}说的是什么?`,
        answer: line.meaning,
        options: opts,
        answerIndex: opts.indexOf(line.meaning),
        explanation: `${line.speaker}: ${line.jp}`,
      });
    }
  }
  return out;
}

// ================================================================
// Main
// ================================================================
function main() {
  console.log('📚  解析「新编日语教程第一册」...\n');

  // 1. 读 4 个源
  const vocabMD = readMD(FILES.vocab);
  const grammarMD = readMD(FILES.grammar);
  const dialogsMD = readMD(FILES.dialogs);
  const phrasesMD = readMD(FILES.phrases);

  // 2. 解析
  const vocabRaw = parseVocab(vocabMD);
  const grammarRaw = parseGrammar(grammarMD);
  const dialogsRaw = parseDialogs(dialogsMD);
  const phrasesRaw = parsePhrases(phrasesMD);

  console.log(`  单词解析: ${vocabRaw.length} 条`);
  console.log(`  语法解析: ${grammarRaw.length} 条`);
  console.log(`  对话解析: ${dialogsRaw.length} 段 (含 ${dialogsRaw.reduce((s, d) => s + d.lines.length, 0)} 行)`);
  console.log(`  短句解析: ${phrasesRaw.length} 课 (含 ${phrasesRaw.reduce((s, l) => s + l.items.length, 0)} 条)`);

  // 3. 转 WordEntry / GrammarEntry / Dialog
  const words = buildWords(vocabRaw);
  const grammar = buildGrammarEntries(grammarRaw);
  const dialogs = buildDialogs(dialogsRaw);

  // 4. 派生 quiz + listening
  const quiz = buildQuiz(words, dialogs);
  const listening = buildListening(words, dialogs);

  // 5. 写文件
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'words.json'), JSON.stringify(words, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'grammar.json'), JSON.stringify(grammar, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'dialogs.json'), JSON.stringify(dialogs, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'listening.json'), JSON.stringify(listening, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT, 'quiz.json'), JSON.stringify(quiz, null, 2) + '\n');

  // 6. 更新 scenarios-index.json
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const meta = {
    id: 'textbook-n5',
    title: '新编日语教程第一册 (N5)',
    subtitle: 'JLPT N5 / 标准日语初级上',
    emoji: '📘',
    color: 'from-indigo-500 via-blue-500 to-sky-500',
    category: 'exam',
    description: '新编日语教程第一册全文:五十音图入门到基础语法,含 20 课单词、语法点、会话文和文章,系统覆盖 N5 水平所需的所有基础词汇和句型。适合零基础起步到 N5 备考。',
    goals: [
      '掌握 50 音图 + 浊音/半浊音/拗音/长音/促音',
      '学会约 500+ 基础词汇(名词/动词/形容词/副词/助词)',
      '掌握 N5 必考语法(〜です/〜ます/〜てください/〜たい/〜てもいい等)',
      '能听懂日常寒暄和自我介绍',
      '能读懂简单日语会话文和文章',
    ],
    pdf: undefined,
  };
  if (!idx.find((s) => s.id === 'textbook-n5')) {
    idx.push(meta);
    fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + '\n');
    console.log('\n✅ scenarios-index.json 已添加 textbook-n5');
  }

  // 7. 总结
  console.log(`\n✅ words.json: ${words.length} 词`);
  console.log(`✅ grammar.json: ${grammar.length} 句型`);
  console.log(`✅ dialogs.json: ${dialogs.length} 段对话`);
  console.log(`✅ listening.json: ${listening.length} 题`);
  console.log(`✅ quiz.json: ${quiz.length} 题`);

  // 课程分布
  const byLesson = {};
  for (const w of words) byLesson[w.lesson] = (byLesson[w.lesson] || 0) + 1;
  console.log(`\n单词按课分布: ${Object.entries(byLesson).map(([k, v]) => `第${k}課(${v})`).join(', ')}`);
}

main();