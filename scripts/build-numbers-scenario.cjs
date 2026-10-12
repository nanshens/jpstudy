// 生成 numbers 场景的数据:words.json + quiz.json + 更新 scenarios-index.json
// 内容:基数词 0-亿 + 月份 + 星期 + 日期 + 时间 + 量词 + 计数器特殊读音
// 用法: node scripts/build-numbers-scenario.cjs

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCENARIO_DIR = path.join(ROOT, 'public', 'data', 'scenarios', 'numbers');
const INDEX_PATH = path.join(ROOT, 'public', 'data', 'scenarios-index.json');

// ---- 词库 ----
// 关键:特殊读音必须明确列出 (4月=しがつ, 7月=しちがつ, 9月=くがつ, 一日=ついたち, 二人=ふたり 等)
const WORDS_RAW = [
  // ===== 基数词 0-10 =====
  { jp: 'ゼロ', reading: 'ゼロ', meaning: '0', tag: '个位数', base: '0' },
  { jp: '零', reading: 'ゼロ/れい', meaning: '0', tag: '个位数', base: '0' },
  { jp: '一', reading: 'いち', meaning: '1', tag: '个位数', base: '1' },
  { jp: '二', reading: 'に', meaning: '2', tag: '个位数', base: '2' },
  { jp: '三', reading: 'さん', meaning: '3', tag: '个位数', base: '3' },
  { jp: '四', reading: 'し/よん', meaning: '4', tag: '个位数', base: '4' },
  { jp: '五', reading: 'ご', meaning: '5', tag: '个位数', base: '5' },
  { jp: '六', reading: 'ろく', meaning: '6', tag: '个位数', base: '6' },
  { jp: '七', reading: 'しち/なな', meaning: '7', tag: '个位数', base: '7' },
  { jp: '八', reading: 'はち', meaning: '8', tag: '个位数', base: '8' },
  { jp: '九', reading: 'きゅう/く', meaning: '9', tag: '个位数', base: '9' },
  { jp: '十', reading: 'じゅう', meaning: '10', tag: '个位数', base: '10' },

  // ===== 11-19 (重点是 14=じゅうよん/じゅうし, 19=じゅうきゅう/じゅうく) =====
  { jp: '十一', reading: 'じゅういち', meaning: '11', tag: '十几' },
  { jp: '十二', reading: 'じゅうに', meaning: '12', tag: '十几' },
  { jp: '十三', reading: 'じゅうさん', meaning: '13', tag: '十几' },
  { jp: '十四', reading: 'じゅうよん/じゅうし', meaning: '14', tag: '十几', note: '口语常用じゅうよん' },
  { jp: '十五', reading: 'じゅうご', meaning: '15', tag: '十几' },
  { jp: '十六', reading: 'じゅうろく', meaning: '16', tag: '十几' },
  { jp: '十七', reading: 'じゅうなな/じゅうしち', meaning: '17', tag: '十几', note: '口语常用じゅうなな' },
  { jp: '十八', reading: 'じゅうはち', meaning: '18', tag: '十几' },
  { jp: '十九', reading: 'じゅうきゅう/じゅうく', meaning: '19', tag: '十几', note: '口语常用じゅうきゅう' },

  // ===== 十位 20, 30, ..., 90 =====
  { jp: '二十', reading: 'にじゅう', meaning: '20', tag: '十位' },
  { jp: '三十', reading: 'さんじゅう', meaning: '30', tag: '十位' },
  { jp: '四十', reading: 'よんじゅう', meaning: '40', tag: '十位', note: '口语常用,非しじゅう' },
  { jp: '五十', reading: 'ごじゅう', meaning: '50', tag: '十位' },
  { jp: '六十', reading: 'ろくじゅう', meaning: '60', tag: '十位' },
  { jp: '七十', reading: 'ななじゅう', meaning: '70', tag: '十位', note: '口语常用,非しちじゅう' },
  { jp: '八十', reading: 'はちじゅう', meaning: '80', tag: '十位' },
  { jp: '九十', reading: 'きゅうじゅう', meaning: '90', tag: '十位' },

  // ===== 百位 100-900 (重点:300=さんびゃく, 600=ろっぴゃく, 800=はっぴゃく) =====
  { jp: '百', reading: 'ひゃく', meaning: '100', tag: '百位', base: '100' },
  { jp: '二百', reading: 'にひゃく', meaning: '200', tag: '百位' },
  { jp: '三百', reading: 'さんびゃく', meaning: '300', tag: '百位', note: '浊变:さんびゃく非さんひゃく' },
  { jp: '四百', reading: 'よんひゃく', meaning: '400', tag: '百位' },
  { jp: '五百', reading: 'ごひゃく', meaning: '500', tag: '百位' },
  { jp: '六百', reading: 'ろっぴゃく', meaning: '600', tag: '百位', note: '促音变:ろっぴゃく' },
  { jp: '七百', reading: 'ななひゃく', meaning: '700', tag: '百位' },
  { jp: '八百', reading: 'はっぴゃく', meaning: '800', tag: '百位', note: '促音变:はっぴゃく' },
  { jp: '九百', reading: 'きゅうひゃく', meaning: '900', tag: '百位' },

  // ===== 千位 1000-9000 (重点:3000=さんぜん, 8000=はっせん) =====
  { jp: '千', reading: 'せん', meaning: '1000', tag: '千位', base: '1000' },
  { jp: '二千', reading: 'にせん', meaning: '2000', tag: '千位' },
  { jp: '三千', reading: 'さんぜん', meaning: '3000', tag: '千位', note: '浊变:さんぜん非さんせん' },
  { jp: '四千', reading: 'よんせん', meaning: '4000', tag: '千位' },
  { jp: '五千', reading: 'ごせん', meaning: '5000', tag: '千位' },
  { jp: '六千', reading: 'ろくせん', meaning: '6000', tag: '千位' },
  { jp: '七千', reading: 'ななせん', meaning: '7000', tag: '千位' },
  { jp: '八千', reading: 'はっせん', meaning: '8000', tag: '千位', note: '促音变:はっせん' },
  { jp: '九千', reading: 'きゅうせん', meaning: '9000', tag: '千位' },

  // ===== 万以上 =====
  { jp: '一万', reading: 'いちまん', meaning: '10000 / 1万', tag: '万以上' },
  { jp: '二万', reading: 'にまん', meaning: '20000 / 2万', tag: '万以上' },
  { jp: '五万', reading: 'ごまん', meaning: '50000 / 5万', tag: '万以上' },
  { jp: '十万', reading: 'じゅうまん', meaning: '100000 / 10万', tag: '万以上' },
  { jp: '百万', reading: 'ひゃくまん', meaning: '1000000 / 百万', tag: '万以上' },
  { jp: '千万', reading: 'せんまん', meaning: '10000000 / 千万', tag: '万以上' },
  { jp: '一億', reading: 'いちおく', meaning: '100000000 / 1亿', tag: '万以上' },

  // ===== 月份 1-12 (重点:4月=しがつ, 7月=しちがつ, 9月=くがつ) =====
  { jp: '一月', reading: 'いちがつ', meaning: '1月', tag: '月份' },
  { jp: '二月', reading: 'にがつ', meaning: '2月', tag: '月份' },
  { jp: '三月', reading: 'さんがつ', meaning: '3月', tag: '月份' },
  { jp: '四月', reading: 'しがつ', meaning: '4月', tag: '月份', note: '特殊:しがつ非よんがつ' },
  { jp: '五月', reading: 'ごがつ', meaning: '5月', tag: '月份' },
  { jp: '六月', reading: 'ろくがつ', meaning: '6月', tag: '月份' },
  { jp: '七月', reading: 'しちがつ', meaning: '7月', tag: '月份', note: '特殊:しちがつ非なながつ' },
  { jp: '八月', reading: 'はちがつ', meaning: '8月', tag: '月份' },
  { jp: '九月', reading: 'くがつ', meaning: '9月', tag: '月份', note: '特殊:くがつ非きゅうがつ' },
  { jp: '十月', reading: 'じゅうがつ', meaning: '10月', tag: '月份' },
  { jp: '十一月', reading: 'じゅういちがつ', meaning: '11月', tag: '月份' },
  { jp: '十二月', reading: 'じゅうにがつ', meaning: '12月', tag: '月份' },

  // ===== 星期 =====
  { jp: '月曜日', reading: 'げつようび', meaning: '星期一 / Monday', tag: '星期' },
  { jp: '火曜日', reading: 'かようび', meaning: '星期二 / Tuesday', tag: '星期' },
  { jp: '水曜日', reading: 'すいようび', meaning: '星期三 / Wednesday', tag: '星期' },
  { jp: '木曜日', reading: 'もくようび', meaning: '星期四 / Thursday', tag: '星期' },
  { jp: '金曜日', reading: 'きんようび', meaning: '星期五 / Friday', tag: '星期' },
  { jp: '土曜日', reading: 'どようび', meaning: '星期六 / Saturday', tag: '星期' },
  { jp: '日曜日', reading: 'にちようび', meaning: '星期日 / Sunday', tag: '星期' },

  // 短星期(口语)
  { jp: '月曜', reading: 'げつよう', meaning: '周一(简)', tag: '星期简称' },
  { jp: '火曜', reading: 'かよう', meaning: '周二(简)', tag: '星期简称' },
  { jp: '水曜', reading: 'すいよう', meaning: '周三(简)', tag: '星期简称' },
  { jp: '木曜', reading: 'もくよう', meaning: '周四(简)', tag: '星期简称' },
  { jp: '金曜', reading: 'きんよう', meaning: '周五(简)', tag: '星期简称' },
  { jp: '土曜', reading: 'どよう', meaning: '周六(简)', tag: '星期简称' },
  { jp: '日曜', reading: 'にちよう', meaning: '周日(简)', tag: '星期简称' },

  // ===== 日期 1-31 (重点:特殊读音) =====
  { jp: '一日', reading: 'ついたち/いちにち', meaning: '1号 / 1天', tag: '日期', note: '日期=ついたち;天数=いちにち' },
  { jp: '二日', reading: 'ふつか', meaning: '2号 / 2天', tag: '日期' },
  { jp: '三日', reading: 'みっか', meaning: '3号 / 3天', tag: '日期' },
  { jp: '四日', reading: 'よっか', meaning: '4号 / 4天', tag: '日期' },
  { jp: '五日', reading: 'いつか', meaning: '5号 / 5天', tag: '日期' },
  { jp: '六日', reading: 'むいか', meaning: '6号 / 6天', tag: '日期' },
  { jp: '七日', reading: 'なのか/しちにち', meaning: '7号 / 7天', tag: '日期' },
  { jp: '八日', reading: 'ようか', meaning: '8号 / 8天', tag: '日期' },
  { jp: '九日', reading: 'ここのか', meaning: '9号 / 9天', tag: '日期' },
  { jp: '十日', reading: 'とおか', meaning: '10号 / 10天', tag: '日期' },
  { jp: '十四日', reading: 'じゅうよっか', meaning: '14号', tag: '日期' },
  { jp: '二十日', reading: 'はつか', meaning: '20号', tag: '日期' },
  { jp: '二十四日', reading: 'にじゅうよっか', meaning: '24号', tag: '日期' },

  // ===== 时间 =====
  { jp: '一時', reading: 'いちじ', meaning: '1点(钟)', tag: '时间' },
  { jp: '三時', reading: 'さんじ', meaning: '3点(钟)', tag: '时间' },
  { jp: '六時', reading: 'ろくじ', meaning: '6点(钟)', tag: '时间' },
  { jp: '十二時', reading: 'じゅうにじ', meaning: '12点(钟)', tag: '时间' },
  { jp: '半', reading: 'はん', meaning: '半 / 一半', tag: '时间' },
  { jp: '一分', reading: 'いっぷん', meaning: '1分钟', tag: '时间' },
  { jp: '三分', reading: 'さんぷん', meaning: '3分钟', tag: '时间' },
  { jp: '十分', reading: 'じっぷん/じゅっぷん', meaning: '10分钟', tag: '时间' },
  { jp: '一秒', reading: 'いちびょう', meaning: '1秒', tag: '时间' },
  { jp: '一日中', reading: 'いちにちじゅう', meaning: '一整天', tag: '时间' },

  // ===== 量词 / 计数器 (重点:特殊读音) =====
  { jp: '一人', reading: 'ひとり', meaning: '1人', tag: '量词' },
  { jp: '二人', reading: 'ふたり', meaning: '2人', tag: '量词', note: '特殊:ふたり非ににん' },
  { jp: '三人', reading: 'さんにん', meaning: '3人', tag: '量词' },
  { jp: '四人', reading: 'よにん', meaning: '4人', tag: '量词', note: '特殊:よにん非よんにん' },
  { jp: '五人', reading: 'ごにん', meaning: '5人', tag: '量词' },
  { jp: '六人', reading: 'ろくにん', meaning: '6人', tag: '量词' },
  { jp: '十人', reading: 'じゅうにん', meaning: '10人', tag: '量词' },
  { jp: '一人', reading: 'ひとり', meaning: '1个人(独自)', tag: '量词' },
  { jp: '一台', reading: 'いちだい', meaning: '1台(机器/车)', tag: '量词' },
  { jp: '二本', reading: 'にほん', meaning: '2根(细长物)', tag: '量词', note: '特殊:にほん非にぼん' },
  { jp: '一本', reading: 'いっぽん', meaning: '1根(细长物)', tag: '量词', note: '促音变:いっぽん' },
  { jp: '三枚', reading: 'さんまい', meaning: '3张(薄物)', tag: '量词', note: '特殊:さんまい非さんまい' },
  { jp: '一枚', reading: 'いちまい', meaning: '1张(薄物)', tag: '量词' },
  { jp: '一匹', reading: 'いっぴき', meaning: '1只(中小动物)', tag: '量词', note: '促音变:いっぴき' },
  { jp: '一羽', reading: 'いちわ', meaning: '1只(鸟)', tag: '量词', note: '特殊:いちわ非いちう' },
  { jp: '一回', reading: 'いっかい', meaning: '1次', tag: '量词', note: '促音变:いっかい' },
  { jp: '二回', reading: 'にかい', meaning: '2次', tag: '量词' },
  { jp: '一階', reading: 'いっかい', meaning: '1楼', tag: '量词', note: '促音变:いっかい(同音)' },
  { jp: '三階', reading: 'さんがい', meaning: '3楼', tag: '量词' },
  { jp: '一歳', reading: 'いっさい', meaning: '1岁', tag: '量词', note: '促音变:いっさい' },
  { jp: '五歳', reading: 'ごさい', meaning: '5岁', tag: '量词' },
  { jp: '一円', reading: 'いちえん', meaning: '1日元', tag: '量词' },

  // ===== 价格 / 钱 =====
  { jp: '百円', reading: 'ひゃくえん', meaning: '100日元', tag: '价格' },
  { jp: '千円', reading: 'せんえん', meaning: '1000日元', tag: '价格' },
  { jp: '一万円', reading: 'いちまんえん', meaning: '10000日元(1万日元)', tag: '价格' },
  { jp: '十万円', reading: 'じゅうまんえん', meaning: '10万日元', tag: '价格' },

  // ===== 电话 / 邮编 / 地址 =====
  { jp: '電話番号', reading: 'でんわばんごう', meaning: '电话号码', tag: '联系方式' },
  { jp: '郵便番号', reading: 'ゆうびんばんごう', meaning: '邮编', tag: '联系方式' },
  { jp: '一丁目', reading: 'いっちょうめ', meaning: '1丁目', tag: '地址' },
  { jp: '二番地', reading: 'にばんち', meaning: '2番地', tag: '地址' },
  { jp: '三号', reading: 'さんごう', meaning: '3号', tag: '地址' },

  // ===== 比例 / 数字用法 =====
  { jp: '一番', reading: 'いちばん', meaning: '第一 / 最', tag: '用法' },
  { jp: '一度', reading: 'いちど', meaning: '一次 / 一回', tag: '用法' },
  { jp: '二倍', reading: 'にばい', meaning: '2倍', tag: '用法' },
  { jp: '全部', reading: 'ぜんぶ', meaning: '全部', tag: '用法' },
  { jp: '約', reading: 'やく', meaning: '大约', tag: '用法' },
  { jp: '以上', reading: 'いじょう', meaning: '以上', tag: '用法' },
  { jp: '以下', reading: 'いか', meaning: '以下', tag: '用法' },
  { jp: '未満', reading: 'みまん', meaning: '未满', tag: '用法' },
  { jp: '毎週', reading: 'まいしゅう', meaning: '每周', tag: '用法' },
  { jp: '毎月', reading: 'まいつき', meaning: '每月', tag: '用法' },
  { jp: '毎年', reading: 'まいとし/まいねん', meaning: '每年', tag: '用法' },

  // ===== 长度 / 重量 =====
  { jp: '一キロ', reading: 'いちキロ', meaning: '1公斤/1公里', tag: '度量' },
  { jp: '一メートル', reading: 'いちメートル', meaning: '1米', tag: '度量' },
  { jp: '百グラム', reading: 'ひゃくグラム', meaning: '100克', tag: '度量' },
  { jp: '三十度', reading: 'さんじゅうど', meaning: '30度', tag: '度量' },
];

// ---- 标准化为 WordEntry ----
function romajiOf(reading) {
  // 极简 romaji 生成 (片假名 + 一些日文符号)
  const table = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'わ':'wa','ゐ':'wi','ゑ':'we','を':'wo',
    'ん':'n',
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
    'っ':'','ー':'','・':'','°':'',
  };
  // katakana → hiragana (差 0x60)
  function k2h(s) {
    let out = '';
    for (const c of s) {
      const code = c.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCharCode(code - 0x60);
      else out += c;
    }
    return out;
  }
  let s = k2h(reading);
  // 处理特殊: ち→chi (但 ティ→tei 等片假名外来词复杂,简单化)
  // 主要保留普通假名的转换
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
  // 单字符
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += table[s[i]] ?? s[i];
  }
  return out.toLowerCase();
}

const WORDS = WORDS_RAW.map((w, i) => ({
  id: `num-${String(i + 1).padStart(3, '0')}`,
  jp: w.jp,
  reading: w.reading,
  romaji: romajiOf(w.reading.split('/')[0]),
  meaning: w.meaning,
  tag: [w.tag],
  note: w.note,
}));

// ---- 派生 Quiz 题目 ----
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 把汉字转阿拉伯数字,作为数字题干扰项的"正确答案"
function numericMeaning(meaning) {
  // 提取第一个数字
  const m = meaning.match(/(\d+)/);
  if (m) return m[1];
  return meaning;
}

// 选择干扰项 - 优先同 tag,其次全局随机
function pickDistractors(target, n, sourceIndex, byTag) {
  const candidates = [];
  const tag = target.tag?.[0];
  if (tag && byTag[tag]) {
    candidates.push(...byTag[tag].filter(w => w.id !== target.id));
  }
  // 全局补充
  if (candidates.length < n * 3) {
    candidates.push(...WORDS.filter(w => w.id !== target.id && !candidates.includes(w)));
  }
  return shuffle(candidates).slice(0, n);
}

function buildQuiz() {
  const byTag = {};
  for (const w of WORDS) {
    const t = w.tag[0];
    (byTag[t] ??= []).push(w);
  }

  const out = [];

  for (const w of WORDS) {
    const meaning = w.meaning;
    const idBase = w.id;

    // 1) 看汉字选意思 (choice) - 中文 + 3 干扰
    {
      const distractors = pickDistractors(w, 3, WORDS.indexOf(w), byTag).map(d => d.meaning);
      const options = shuffle([meaning, ...distractors]);
      out.push({
        id: `${idBase}-c1`,
        type: 'choice',
        question: `「${w.jp}」是什么意思?`,
        options,
        answerIndex: options.indexOf(meaning),
        explanation: `${w.jp} = ${meaning} (${w.reading})`,
      });
    }

    // 2) 听日文选意思 (listening)
    {
      const distractors = pickDistractors(w, 3, WORDS.indexOf(w), byTag).map(d => d.meaning);
      const options = shuffle([meaning, ...distractors]);
      out.push({
        id: `${idBase}-l1`,
        type: 'listening',
        audio: w.jp,
        question: '听到的词是什么意思?',
        options,
        answerIndex: options.indexOf(meaning),
        explanation: `${w.jp} = ${meaning}`,
      });
    }

    // 3) 看中文选日文 (choice2)
    {
      const distractors = pickDistractors(w, 3, WORDS.indexOf(w), byTag).map(d => d.jp);
      const options = shuffle([w.jp, ...distractors]);
      out.push({
        id: `${idBase}-c2`,
        type: 'choice',
        question: `「${meaning}」的日文是?`,
        options,
        answerIndex: options.indexOf(w.jp),
        explanation: `${meaning} = ${w.jp} (${w.reading})`,
      });
    }

    // 4) 看汉字选假名 (choice3)
    {
      const distractors = pickDistractors(w, 3, WORDS.indexOf(w), byTag).map(d => d.reading.split('/')[0]);
      const options = shuffle([w.reading.split('/')[0], ...distractors]);
      out.push({
        id: `${idBase}-c3`,
        type: 'choice',
        question: `「${w.jp}」的读音是?`,
        options,
        answerIndex: options.indexOf(w.reading.split('/')[0]),
        explanation: `${w.jp} = ${w.reading}`,
      });
    }

    // 5) 看汉字写假名 (spelling)
    {
      out.push({
        id: `${idBase}-s1`,
        type: 'spelling',
        prompt: w.jp,
        question: '请写出读音(假名)',
        answer: w.reading.split('/')[0],
        answerFormat: 'hiragana',
        explanation: `${w.jp} = ${w.reading} (${meaning})`,
      });
    }

    // 6) 听日文写假名 (spell-audio)
    {
      out.push({
        id: `${idBase}-sa1`,
        type: 'spell-audio',
        audio: w.jp,
        question: '听音频,写出假名',
        answer: w.reading.split('/')[0],
        answerFormat: 'hiragana',
        explanation: `${w.jp} = ${w.reading} (${meaning})`,
      });
    }

    // 7) 真假判断 (数字场景特有: 判断数字对错)
    // 例: "三百=さんびゃく" (对) / "三百=さんひゃく" (错)
    if (w.reading && w.reading.length > 1) {
      const real = w.jp;
      // 干扰项用 "随机其他词" + "正确假名"
      const correct = w.reading.split('/')[0];
      const others = pickDistractors(w, 3, WORDS.indexOf(w), byTag).map(d => d.reading.split('/')[0]);
      const tfOptions = shuffle([
        correct,
        others[0],
      ]);
      out.push({
        id: `${idBase}-tf1`,
        type: 'truefalse',
        question: `${real} 的读音是「${correct}」?`,
        options: tfOptions,
        answerIndex: tfOptions.indexOf(correct),
        explanation: `${real} 读作「${correct}」`,
      });
    }
  }

  return out;
}

const quiz = buildQuiz();

// ---- 写文件 ----
fs.mkdirSync(SCENARIO_DIR, { recursive: true });

// 听力题生成
function buildListening() {
  const out = [];
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    const distractors = shuffle(WORDS.filter((x) => x.id !== w.id))
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

const meta = {
  id: 'numbers',
  title: '数字・時間・カレンダー',
  subtitle: '数字 / 时间 / 日期 / 量词',
  emoji: '🔢',
  color: 'from-cyan-500 via-teal-500 to-emerald-500',
  category: 'life',
  description: '从 0 到 1 億,从 1 月到 12 月,从月曜到日曜,从 1 人到 10 人,把日语数字相关的读音、写法、特殊变音(さんびゃく/ろっぴゃく/ふたり/じゅうよん 等)一次性掌握。听力 + 拼写双管齐下,练到自然反应。',
  goals: [
    '记住 0-10 数字读音',
    '掌握 10-99 十位/十几的特殊读法(14=じゅうよん、19=じゅうきゅう、40=よんじゅう、70=ななじゅう)',
    '理解百位/千位的浊变和促音变(300=さんびゃく/600=ろっぴゃく/800=はっぴゃく/3000=さんぜん/8000=はっせん)',
    '掌握 1-12 月份 + 星期全称简称',
    '理解日语量词的特殊读音(1人=ひとり、2人=ふたり、4人=よにん)',
  ],
  pdf: undefined,
  pdfLabel: undefined,
};

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
if (!indexData.find((s) => s.id === 'numbers')) {
  indexData.push(meta);
  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2) + '\n');
  console.log('✅ scenarios-index.json 已更新');
}

fs.writeFileSync(path.join(SCENARIO_DIR, 'words.json'), JSON.stringify(WORDS, null, 2) + '\n');
console.log(`✅ words.json: ${WORDS.length} 词`);

fs.writeFileSync(path.join(SCENARIO_DIR, 'quiz.json'), JSON.stringify(quiz, null, 2) + '\n');
console.log(`✅ quiz.json: ${quiz.length} 题 (派生 ${(quiz.length / WORDS.length).toFixed(1)}x)`);

// 听力题
const listening = buildListening();
fs.writeFileSync(path.join(SCENARIO_DIR, 'listening.json'), JSON.stringify(listening, null, 2) + '\n');
console.log(`✅ listening.json: ${listening.length} 题`);

// 显示统计
const byTag = {};
for (const w of WORDS) {
  const t = w.tag[0];
  byTag[t] = (byTag[t] || 0) + 1;
}
console.log('\n词库按 tag 统计:');
for (const [t, n] of Object.entries(byTag)) {
  console.log(`  ${t}: ${n}`);
}

const byType = {};
for (const q of quiz) byType[q.type] = (byType[q.type] || 0) + 1;
console.log('\nQuiz 按题型统计:');
for (const [t, n] of Object.entries(byType)) {
  console.log(`  ${t}: ${n}`);
}