// 给 traffic-rules 生成 5 种新题型的数据
// - listening:    听力选择(听日文单词,选中文意思)  25 题
// - response:     听力选择回答(听日文问句,选回答)    15 题
// - truefalse + audio: 听力判断意思(听日文短句,判断中文意思是否对)  20 题
// - spelling:     拼写测试(看 kanji 写假名)            25 题
// - spell-audio:  听力拼写(听日文单词,写假名)          15 题
// 共 100 题
const fs = require('fs');
const path = require('path');

const SCENARIO_DIR = path.resolve(__dirname, '..', 'public', 'data', 'scenarios', 'traffic-rules');

const words = JSON.parse(fs.readFileSync(path.join(SCENARIO_DIR, 'words.json'), 'utf8'));
const quiz250 = JSON.parse(fs.readFileSync(path.join(SCENARIO_DIR, 'quiz.json'), 'utf8'));

// 工具:从数组里随机抽 n 个不重复的 index
function pickN(arr, n, exclude = new Set()) {
  const pool = arr.map((_, i) => i).filter((i) => !exclude.has(i));
  const out = [];
  for (let k = 0; k < n && pool.length; k++) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool[i]);
    pool.splice(i, 1);
  }
  return out;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const rnd = (n) => Math.floor(Math.random() * n);

const newQuestions = [];

// ============ 1) listening 听力选择(25) ============
// audio 播放日文单词,选项 4 个中文意思(1 对 3 错)
{
  const indexes = pickN(words, 25);
  for (const i of indexes) {
    const w = words[i];
    // 3 个错误选项:同 tag 里其他词的 meaning 优先,然后全局随机
    const sameTag = words.filter((x) => x.id !== w.id && (x.tag?.[0] === w.tag?.[0])).map((x) => x.meaning);
    let wrongs = sameTag.length >= 3 ? shuffle(sameTag).slice(0, 3) : [];
    while (wrongs.length < 3) {
      const j = rnd(words.length);
      if (j !== i && !wrongs.includes(words[j].meaning) && words[j].meaning !== w.meaning) {
        wrongs.push(words[j].meaning);
      }
    }
    const opts = shuffle([w.meaning, ...wrongs]);
    newQuestions.push({
      id: `tr-L${String(indexes.indexOf(i) + 1).padStart(2, '0')}`,
      type: 'listening',
      question: '请选出听到的词的中文意思',
      audio: w.jp,
      options: opts,
      answerIndex: opts.indexOf(w.meaning),
      explanation: `${w.jp} (${w.reading}) = ${w.meaning}`,
    });
  }
}

// ============ 2) response 听力选择回答(15) ============
// 模拟驾考/驾校常见对话
const DIALOGS = [
  { q: 'おはようございます。', opts: ['おはようございます。', 'こんにちは。', 'こんばんは。', 'おやすみなさい。'], ans: 0, exp: '早上好→早上好' },
  { q: 'ありがとうございました。', opts: ['どういたしまして。', 'おはようございます。', 'さようなら。', 'いただきます。'], ans: 0, exp: '谢谢→不客气' },
  { q: 'すみません、入口はどこですか?', opts: ['あちらです。', 'ありがとうございます。', 'いただきます。', 'おやすみなさい。'], ans: 0, exp: '请问入口在哪里→在那边' },
  { q: '今日は何曜日ですか?', opts: ['水曜日です。', 'いいえ。', 'ありがとうございました。', 'おやすみなさい。'], ans: 0, exp: '今天星期几→星期三' },
  { q: 'いくらですか?', opts: ['八百円です。', 'ありがとうございました。', 'おはようございます。', '右に折ってください。'], ans: 0, exp: '多少钱→八百日元' },
  { q: 'もう一度お願いします。', opts: ['はい、どうぞ。', 'いいえ。', 'さようなら。', '左に折ってください。'], ans: 0, exp: '请再说一次→好的,请' },
  { q: 'ミラーを見てください。', opts: ['はい、見ました。', 'ありがとうございました。', '左に折ります。', '止まります。'], ans: 0, exp: '请看后视镜→好的,看了' },
  { q: '左に折ってください。', opts: ['はい、左に折ります。', '右に折ります。', '止まります。', '直進します。'], ans: 0, exp: '请左转→好的,左转' },
  { q: '右に折ってください。', opts: ['はい、右に折ります。', '左に折ります。', '止まります。', '直進します。'], ans: 0, exp: '请右转→好的,右转' },
  { q: '一時停止してください。', opts: ['はい、止まります。', '直進します。', '右に折ります。', '左に折ります。'], ans: 0, exp: '请临时停车→好的,停车' },
  { q: '発進してください。', opts: ['はい、発進します。', '止まります。', 'バックします。', '駐車します。'], ans: 0, exp: '请起步→好的,起步' },
  { q: '速度を落としてください。', opts: ['はい、落とします。', '上げます。', '止まります。', '右に折ります。'], ans: 0, exp: '请降低速度→好的,降速' },
  { q: 'ギアをセカンドに入れてください。', opts: ['はい、入れました。', '下げました。', '止めました。', '開けました。'], ans: 0, exp: '请挂二挡→好的,挂好了' },
  { q: 'ウインカーを出してください。', opts: ['はい、出しました。', '止めました。', '閉じました。', '下げました。'], ans: 0, exp: '请打转向灯→好的,打开了' },
  { q: 'お先に失礼します。', opts: ['お疲れさまでした。', 'ありがとうございます。', 'いただきます。', 'おはようございます。'], ans: 0, exp: '我先走了→辛苦了' },
];
for (let i = 0; i < DIALOGS.length; i++) {
  const d = DIALOGS[i];
  newQuestions.push({
    id: `tr-R${String(i + 1).padStart(2, '0')}`,
    type: 'response',
    question: '听到问句,选出最合适的回答',
    audio: d.q,
    options: d.opts,
    answerIndex: d.ans,
    explanation: d.exp,
  });
}

// ============ 3) listening 听力判断意思(20) ============
// 听日文短句,选项「正しい/正しくない」+ 中文意思,判意思翻译是否对
const SENTENCES = [
  { jp: '一時停止してください。', cn: '请临时停车。', ans: 0 },
  { jp: '右に折ってください。', cn: '请向左转。', ans: 1 },
  { jp: 'ミラーを見てください。', cn: '请看后视镜。', ans: 0 },
  { jp: '発進してください。', cn: '请停车。', ans: 1 },
  { jp: '徐行してください。', cn: '请慢行。', ans: 0 },
  { jp: 'ギアをセカンドに入れてください。', cn: '请挂一挡。', ans: 1 },
  { jp: 'お先に失礼します。', cn: '我先告辞了。', ans: 0 },
  { jp: '速度を落としてください。', cn: '请提高速度。', ans: 1 },
  { jp: 'おはようございます。', cn: '晚上好。', ans: 1 },
  { jp: 'ありがとうございます。', cn: '非常感谢。', ans: 0 },
  { jp: 'ウィンカーを出してください。', cn: '请打转向灯。', ans: 0 },
  { jp: 'ブレーキを踏んでください。', cn: '请踩油门。', ans: 1 },
  { jp: 'バックしてください。', cn: '请倒车。', ans: 0 },
  { jp: '左に寄ってください。', cn: '请靠右。', ans: 1 },
  { jp: '駐車してください。', cn: '请停车。', ans: 0 },
  { jp: 'ありがとうございました。', cn: '非常感谢。', ans: 0 },
  { jp: '止まれ。', cn: '请慢行。', ans: 1 },
  { jp: '交差点です。', cn: '这里是十字路口。', ans: 0 },
  { jp: '信号が赤です。', cn: '红灯。', ans: 0 },
  { jp: 'さようなら。', cn: '早上好。', ans: 1 },
];
for (let i = 0; i < SENTENCES.length; i++) {
  const s = SENTENCES[i];
  newQuestions.push({
    id: `tr-AJ${String(i + 1).padStart(2, '0')}`,
    type: 'listening',
    question: `听到的句子,中文意思是「${s.cn}」吗?`,
    audio: s.jp,
    options: ['正しい(对)', '正しくない(不对)'],
    answerIndex: s.ans,
    explanation: `${s.jp} = ${s.cn}`,
  });
}

// ============ 4) spelling 拼写测试(25) ============
// 显示 kanji,写假名读音
{
  // 优先 2-3 字、且不是太偏的词
  const candidates = words.filter((w) => w.jp && w.reading && /[一-龯]/.test(w.jp) && w.jp.length <= 5 && !w.reading.includes('・'));
  const indexes = pickN(candidates, 25);
  for (let k = 0; k < indexes.length; k++) {
    const w = candidates[indexes[k]];
    newQuestions.push({
      id: `tr-S${String(k + 1).padStart(2, '0')}`,
      type: 'spelling',
      question: '请写出读音(假名)',
      prompt: w.jp,
      answer: `${w.reading}|${w.romaji ?? ''}`,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
  }
}

// ============ 5) spell-audio 听力拼写(15) ============
{
  const candidates = words.filter((w) => w.jp && w.reading && w.jp.length <= 5 && !w.reading.includes('・'));
  const indexes = pickN(candidates, 15);
  for (let k = 0; k < indexes.length; k++) {
    const w = candidates[indexes[k]];
    newQuestions.push({
      id: `tr-SA${String(k + 1).padStart(2, '0')}`,
      type: 'spell-audio',
      question: '听音频,写出假名',
      audio: w.jp,
      answer: `${w.reading}|${w.romaji ?? ''}`,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
  }
}

// 打乱顺序
const finalQuestions = shuffle(newQuestions);

const outPath = path.join(SCENARIO_DIR, 'quiz-extras.json');
fs.writeFileSync(outPath, JSON.stringify(finalQuestions, null, 2) + '\n', 'utf8');
console.log(`Generated ${finalQuestions.length} questions → ${outPath}`);

// 统计
const stats = finalQuestions.reduce((acc, q) => {
  acc[q.type] = (acc[q.type] || 0) + 1;
  return acc;
}, {});
console.log('By type:', stats);
