// 给所有常规场景(非 traffic-rules)生成 4 种新题型题
// 每个场景 ~30 题:8 听力选择 + 5 听力回答 + 12 拼写 + 8 听力拼写
// 用场景自己的 words / grammar / dialogs 派生
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public', 'data', 'scenarios');
const TARGETS = ['driving', 'enrollment', 'course-practice', 'road-test', 'signs-rules', 'medical', 'pregnancy'];

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

// 该场景的「听力回答」种子题库(驾考 + 通用,按场景主题挑)
const DIALOG_POOL = {
  driving: [
    { q: 'ミラーを見てください。', opts: ['はい、見ました。', '右に折ります。', '止まります。', '発進します。'], ans: 0, exp: '看后视镜→好的,看了' },
    { q: '左に折ってください。', opts: ['はい、左に折ります。', '右に折ります。', '止まります。', '直進します。'], ans: 0, exp: '请左转→好的,左转' },
    { q: '一時停止してください。', opts: ['はい、止まります。', '直進します。', '右に折ります。', '左に折ります。'], ans: 0, exp: '请临时停车→好的,停车' },
    { q: '発進してください。', opts: ['はい、発進します。', '止まります。', 'バックします。', '駐車します。'], ans: 0, exp: '请起步→好的,起步' },
  ],
  enrollment: [
    { q: 'いらっしゃいませ。', opts: ['失礼します。', 'ありがとうございます。', 'おはようございます。', 'いただきます。'], ans: 0, exp: '欢迎光临→打扰了(到前台)' },
    { q: '本日はどんなご用件ですか?', opts: ['入校の手続きをお願いします。', '右に折ります。', 'ミラーを見ます。', '発進します。'], ans: 0, exp: '请问有什么事→我要办入校手续' },
    { q: '在留カードを見せてください。', opts: ['はい、どうぞ。', 'ありがとうございました。', '左に折ります。', '止まります。'], ans: 0, exp: '请出示在留卡→好的,请' },
    { q: '印鑑はありますか?', opts: ['はい、あります。', 'ミラーを見ます。', '右に折ります。', '発進します。'], ans: 0, exp: '有印章吗→有的' },
  ],
  'course-practice': [
    { q: 'ギヤをセカンドに入れてください。', opts: ['はい、入れました。', '下げました。', '止めました。', '開けました。'], ans: 0, exp: '请挂二挡→好的,挂好了' },
    { q: 'ハンドルを右に切ってください。', opts: ['はい、切ります。', '下げます。', '止めます。', '開けます。'], ans: 0, exp: '请向右打方向盘→好的,打' },
    { q: 'ブレーキを踏んでください。', opts: ['はい、踏みます。', '上げます。', '切ります。', '開けます。'], ans: 0, exp: '请踩刹车→好的,踩' },
    { q: 'ゆっくり進んでください。', opts: ['はい、ゆっくり進みます。', '止まります。', '右に折ります。', 'バックします。'], ans: 0, exp: '请慢速前进→好的,慢速前进' },
  ],
  'road-test': [
    { q: '右に折ってください。', opts: ['はい、右に折ります。', '左に折ります。', '止まります。', '直進します。'], ans: 0, exp: '请右转→好的,右转' },
    { q: 'ウィンカーを出してください。', opts: ['はい、出しました。', '止めました。', '閉じました。', '下げました。'], ans: 0, exp: '请打转向灯→好的,打了' },
    { q: '速度を落としてください。', opts: ['はい、落とします。', '上げます。', '止まります。', '右に折ります。'], ans: 0, exp: '请降低速度→好的,降速' },
    { q: '前に進みましょう。', opts: ['はい、進みます。', '止まります。', 'バックします。', '右に折ります。'], ans: 0, exp: '往前走吧→好的,前进' },
  ],
  'signs-rules': [
    { q: '止まれの標識があります。', opts: ['はい、一時停止します。', '右に折ります。', '発進します。', '加速します。'], ans: 0, exp: '有停车标志→好的,临时停车' },
    { q: '徐行してください。', opts: ['はい、ゆっくり進みます。', '止まります。', '右に折ります。', 'バックします。'], ans: 0, exp: '请慢行→好的,慢速前进' },
    { q: 'この標識はどういう意味ですか?', opts: ['一方通行です。', '右に折ります。', '発進します。', '止まります。'], ans: 0, exp: '这标志什么意思→单行道' },
    { q: '信号が赤です。', opts: ['はい、止まります。', '進みます。', '右に折ります。', '左に折ります。'], ans: 0, exp: '红灯→好的,停车' },
  ],
  medical: [
    { q: 'どうしましたか。', opts: ['頭が痛いんです。', '右に折ります。', 'ミラーを見ます。', '発進します。'], ans: 0, exp: '怎么了→头疼' },
    { q: '熱があります。', opts: ['解熱剤を処方します。', '右に折ります。', 'ミラーを見ます。', '発進します。'], ans: 0, exp: '发烧→给你开退烧药' },
    { q: '保険証はお持ちですか。', opts: ['はい、これです。', '右に折ります。', '発進します。', 'ミラーを見ます。'], ans: 0, exp: '带保险证了吗→带了,这个' },
    { q: 'この薬を食後に飲んでください。', opts: ['はい、分かりました。', '右に折ります。', '発進します。', 'ミラーを見ます。'], ans: 0, exp: '饭后吃药→好的,明白了' },
  ],
  pregnancy: [
    { q: '妊娠届を提出したいのですが。', opts: ['はい、こちらです。', 'ミラーを見ます。', '右に折ります。', '発進します。'], ans: 0, exp: '想提交妊娠申报→好的,这边' },
    { q: '母子手帳をなくしてしまいました。', opts: ['再交付できますので、申請してください。', '右に折ります。', '発進します。', 'ミラーを見ます。'], ans: 0, exp: '母子手册丢了→可以补发,请申请' },
    { q: '陣痛が10分間隔です。', opts: ['今すぐ病院に来てください。', '止まります。', '右に折ります。', 'バックします。'], ans: 0, exp: '阵痛 10 分钟一次→请马上来医院' },
    { q: 'お産の進み方を教えてください。', opts: ['はい、説明します。', '右に折ります。', '発進します。', 'ミラーを見ます。'], ans: 0, exp: '教我分娩进程→好的,我来说明' },
  ],
};

for (const id of TARGETS) {
  const dir = path.join(ROOT, id);
  const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
  const existing = JSON.parse(fs.readFileSync(path.join(dir, 'quiz.json'), 'utf8'));
  const existingIds = new Set(existing.map((q) => q.id));

  // 可用词:有 jp + reading + kanji 的
  const wCandidates = words.filter((w) => w.jp && w.reading && /[一-龯]/.test(w.jp) && w.jp.length <= 6 && !w.reading.includes('・'));
  const wAudio = words.filter((w) => w.jp && w.reading && w.jp.length <= 6 && !w.reading.includes('・'));

  const newQs = [];
  const tag = id.split('-')[0].slice(0, 3); // dri / enr / cou / roa / sig
  const num = (n) => String(n).padStart(2, '0');

  // 1) 听力选择 - 8 题(单词)
  const listenIdx = pickN(wCandidates, 8);
  for (let k = 0; k < listenIdx.length; k++) {
    const w = wCandidates[listenIdx[k]];
    const sameTag = words.filter((x) => x.id !== w.id && x.tag?.[0] === w.tag?.[0]).map((x) => x.meaning);
    let wrongs = sameTag.length >= 3 ? shuffle(sameTag).slice(0, 3) : [];
    while (wrongs.length < 3) {
      const j = rnd(words.length);
      if (j !== w && !wrongs.includes(words[j].meaning) && words[j].meaning !== w.meaning) wrongs.push(words[j].meaning);
    }
    const opts = shuffle([w.meaning, ...wrongs]);
    newQs.push({
      id: `${tag}-L${num(k + 1)}`,
      type: 'listening',
      question: '请选出听到的词的中文意思',
      audio: w.jp,
      options: opts,
      answerIndex: opts.indexOf(w.meaning),
      explanation: `${w.jp} (${w.reading}) = ${w.meaning}`,
    });
  }

  // 2) 听力回答 - 5 题
  const dialogs = DIALOG_POOL[id] || DIALOG_POOL.driving;
  for (let k = 0; k < Math.min(5, dialogs.length); k++) {
    const d = dialogs[k];
    newQs.push({
      id: `${tag}-R${num(k + 1)}`,
      type: 'response',
      question: '听到问句,选出最合适的回答',
      audio: d.q,
      options: d.opts,
      answerIndex: d.ans,
      explanation: d.exp,
    });
  }

  // 3) 拼写 - 12 题(看 kanji 写假名)
  const spellIdx = pickN(wCandidates, 12);
  for (let k = 0; k < spellIdx.length; k++) {
    const w = wCandidates[spellIdx[k]];
    newQs.push({
      id: `${tag}-S${num(k + 1)}`,
      type: 'spelling',
      question: '请写出读音(假名)',
      prompt: w.jp,
      answer: `${w.reading}|${w.romaji ?? ''}`,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
  }

  // 4) 听力拼写 - 8 题
  const saIdx = pickN(wAudio, 8);
  for (let k = 0; k < saIdx.length; k++) {
    const w = wAudio[saIdx[k]];
    newQs.push({
      id: `${tag}-SA${num(k + 1)}`,
      type: 'spell-audio',
      question: '听音频,写出假名',
      audio: w.jp,
      answer: `${w.reading}|${w.romaji ?? ''}`,
      answerFormat: 'hiragana',
      explanation: `${w.jp} = ${w.reading} (${w.meaning})`,
    });
  }

  // 合并到 quiz.json(去重)
  let added = 0;
  for (const q of newQs) {
    if (existingIds.has(q.id)) continue;
    existing.push(q);
    existingIds.add(q.id);
    added++;
  }
  fs.writeFileSync(path.join(dir, 'quiz.json'), JSON.stringify(existing, null, 2) + '\n', 'utf8');
  const stats = existing.reduce((acc, q) => {
    acc[q.type || 'choice'] = (acc[q.type || 'choice'] || 0) + 1;
    return acc;
  }, {});
  console.log(`[${id}] +${added} 题,共 ${existing.length} 题 → ${JSON.stringify(stats)}`);
}
console.log('Done');
