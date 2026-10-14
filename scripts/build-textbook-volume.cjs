// 通用脚本:解析「新编日语教程第N册」4 个 markdown 资源,生成对应 N 级别场景数据
// 用法:
//   node scripts/build-textbook-volume.cjs --volume 1 --level N5
//   node scripts/build-textbook-volume.cjs --volume 2 --level N4

const fs = require('fs');
const path = require('path');

const ASSETS_DIRS = [
  path.join('C:\\Users\\nanshens\\.minimax\\v2\\assets\\2026\\10\\12'),
  path.join('C:\\Users\\nanshens\\.minimax\\v2\\assets\\2026\\10\\13'),
];
const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'public', 'data', 'scenarios-index.json');

// ---- 通用工具 (与第一册脚本相同) ----
function readMD(name) {
  for (const dir of ASSETS_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  throw new Error(`Asset file not found in any dir: ${name}`);
}

// ---- CLI 参数 ----
function parseArgs() {
  const args = { volume: 1, level: 'N5' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--volume') args.volume = +process.argv[++i];
    else if (process.argv[i] === '--level') args.level = process.argv[++i];
  }
  return args;
}
const { volume, level } = parseArgs();

// 第一/二/三/四册 → 课号 1/21/41/61
const VOL_INFO = {
  1: { cn: '第一', title: '新编日语教程第一册', firstLesson: 1 },
  2: { cn: '第二', title: '新编日语教程第二册', firstLesson: 21 },
  3: { cn: '第三', title: '新编日语教程第三册', firstLesson: 41 },
  4: { cn: '第四', title: '新编日语教程第四册', firstLesson: 61 },
};
const volInfo = VOL_INFO[volume];
if (!volInfo) {
  console.error(`❌ volume 必须是 1/2/3/4,你输入了 ${volume}`);
  process.exit(1);
}
const VOL_TITLE = volInfo.title;
const VOL_CN = volInfo.cn;

// 扫描 asset 目录,匹配带时间戳前缀的 markdown
function findAssetFile(suffix) {
  // suffix 例如 "新编日语教程第一册_单词.md"
  // asset 目录里文件形如 "21-43-14-XXX-asset_...-{suffix}"
  for (const dir of ASSETS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      if (e.endsWith(suffix) && e.includes('新编日语教程') && e.endsWith('.md')) {
        return path.join(dir, e);
      }
    }
  }
  throw new Error(`Asset file not found matching suffix: ${suffix} in any of ${ASSETS_DIRS.join(', ')}`);
}
const FILES = {
  vocab: findAssetFile(`新编日语教程${VOL_CN}册_单词.md`),
  grammar: findAssetFile(`新编日语教程${VOL_CN}册_语法.md`),
  dialogs: findAssetFile(`新编日语教程${VOL_CN}册_文章.md`),
  phrases: findAssetFile(`新编日语教程${VOL_CN}册_短句.md`),
};

const SCENE_ID = `textbook-${level.toLowerCase()}`;
const OUT_DIR = path.join(ROOT, 'public', 'data', 'scenarios', SCENE_ID);
const FIRST_LESSON = volInfo.firstLesson;

// ---- 通用工具 ----
function readMD(absPath) {
  if (fs.existsSync(absPath)) {
    // Windows 来源的 md 文件带 CRLF,统一转为 LF
    return fs.readFileSync(absPath, 'utf-8').replace(/\r\n/g, '\n');
  }
  throw new Error(`Asset file not found: ${absPath}`);
}
function splitLessons(md, header = '## 第') {
  // 兼容 CRLF 行尾(md 文件 Windows 来源)
  const lines = md.replace(/\r\n/g, '\n').split('\n');
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
function parseTableRow(line) {
  return line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}
function extractTableRows(lines) {
  const rows = [];
  for (const line of lines) {
    if (/^\|.*\|$/.test(line)) {
      // 跳过表格分隔行 |---|---|---|
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;
      rows.push(parseTableRow(line));
    }
  }
  return rows;
}

// ================================================================
// 1. 单词 vocab (适配多表头多列顺序)
// ================================================================

// 判断一行是否为表格分隔行 |---|---|
function isSeparator(line) {
  return /^\|[\s\-:|]+\|$/.test(line);
}

// 判断一行是否为表头(含已知列名字符串)
const KNOWN_COLUMNS = ['假名', '声调', '词性', '日文汉字', '中文意思', '中文', '外来语', '单词', '读音'];
function isHeaderRow(cells) {
  return cells.some(c => KNOWN_COLUMNS.includes(c));
}

// 判断某列内容是否为声调标记
// 兼容: ① ② ③ / ○0 / ①○0 / ○0/② / ①/② 等单式或双重声调
// 注意: \d 会匹配圈数字中的 ASCII digit (②=U+2461 包含字符"2")，所以用 [0-9] 代替 \d
function isAccent(v) {
  return /^[\u25cb\u25cf\u2460-\u2473\u32d0-\u32fe\u00ae]+$/.test(v) ||
         /^[○0-9]+$/.test(v) ||
         /^[○0-9]+\/?[0-9○①②③④⑤⑥⑦⑧⑨]+$/.test(v) ||
         /^[\u2460-\u2473]\/?[\u2460-\u2473]+$/.test(v);
}

// 判断某列内容是否为假名/罗马字读音
function isReading(v) {
  return /^[a-zA-Zà-žÀ-Ž\-]+$/.test(v) || /^[ァ-ヶー\s]+$/.test(v) || /^[ぁ-んァ-ンa-zA-Z\s\-]+$/.test(v);
}

// 从行中根据列名找值
function getByName(cells, names) {
  for (const n of names) {
    const idx = cells.indexOf(n);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseVocab(md) {
  const lessons = splitLessons(md);
  const all = [];
  const lessonOffset = volume >= 3 ? 40 : 0;

  for (const lesson of lessons) {
    const realLesson = lesson.num + lessonOffset;
    const rawLines = lesson.lines;

    let curHeader = null; // { jp, reading, accent, meaning, pos, extra } 按名查找

    for (let li = 0; li < rawLines.length; li++) {
      const line = rawLines[li];
      if (!/^\|.*\|$/.test(line)) { curHeader = null; continue; } // 非表格行重置表头

      const cells = parseTableRow(line);
      if (cells.length < 2) continue;

      if (isSeparator(line)) continue;

      // 如果是表头行(含列名)，解析列名映射
      if (isHeaderRow(cells)) {
        const map = {};
        cells.forEach((c, i) => { if (c) map[c.trim()] = i; });
        curHeader = map;
        continue;
      }

      // 数据行：需要有有效表头
      if (!curHeader) continue;

      let jp = '', reading = '', accent = '', meaning = '', pos = '';

      // ==============================================================
      // 6列专项处理: 日文|读音|中文|日文|读音|中文 (関連単語动物/地名等)
      // 例如: | 虎 | とら | 虎 | 駱駝 | らくだ | 骆驼 |
      // ==============================================================
      if (cells.length === 6) {
        const [a, b, c, d, e, f] = cells;
        // 分割成两个3列分别处理
        const first3 = [a, b, c];
        const second3 = [d, e, f];
        for (const grp of [first3, second3]) {
          let gj = '', gr = '', ga = '', gm = '';
          const [x, y, z] = grp;
          if (/[々〆]/.test(y) || y.length > 1) { gj = y; gr = x; gm = z; }
          else { gj = y; gr = x; gm = z; if (!gj) { gj = gr; gr = ''; } }
          if (!gj) continue;
          const gjIsKana = /^[ぁ-んァ-ンーa-zA-Z\-\s]+$/.test(gj);
          const grIsKanji = /^[\u4e00-\u9fa5ー〆々]+$/.test(gr);
          if (gjIsKana && grIsKanji && gr.length > 0 && gr !== gj) [gj, gr] = [gr, gj];
          all.push({ jp: gj, reading: gr || gj, accent: ga, pos: '', meaning: gm, lesson: realLesson, lessonTitle: lesson.title });
        }
        continue;
      }

      if (cells.length >= 5) {
        // 5/6 列: 单词|读音|声调|词性|中文  或  基本形|ます形|て形|词性|声调|中文
        // 特殊: 双重声调格式 如 ○0/② (cells[1] 含 /，且 cells[0]=reading 假名 cells[2]=accent)
        // 例如: | はな | ○0/② | (空) | 花/鼻 | 花/鼻子 | → cells = [はな, ○0/②, "", 花/鼻, 花/鼻子]
        if (cells[1] && /\//.test(cells[1]) && isReading(cells[0])) {
          const reading = cells[0];
          const accentParts = cells[1].split('/');
          const jpCell = cells[3] || '';
          const meaningCell = cells[4] || '';
          const jpParts = jpCell ? jpCell.split('/') : [];
          const meaningParts = meaningCell ? meaningCell.split('/') : [];
          for (let i = 0; i < accentParts.length; i++) {
            const gj = jpParts[i] || jpParts[0] || '';
            const gm = meaningParts[i] || meaningParts[0] || '';
            const ga = accentParts[i].trim();
            if (gj) all.push({ jp: gj, reading: reading || gj, accent: ga, pos: '', meaning: gm, lesson: realLesson, lessonTitle: lesson.title });
          }
          continue;
        }
        jp = cells[0] || '';
        reading = cells[1] || '';
        accent = cells[2] || '';
        pos = cells[3] || '';
        meaning = cells.slice(4).join(' ');
      } else if (cells.length === 4) {
        // 4 列: 穷举所有可能的列顺序组合
        // 已知列: 假名, 声调, 日文汉字, 中文意思, 外来语, 词源
        const h = curHeader;
        const total = cells.length;

        // 用已知的声调列位置来辅助判断
        // 声调列: 值为 accent 样式
        let accentIdx = -1;
        for (let i = 0; i < total; i++) {
          if (isAccent(cells[i])) { accentIdx = i; break; }
        }

        // ==============================================================
        // 特殊: 双重声调格式 如 ○0/②
        // 例如: | はな | ○0/② | 花/鼻 | 花/鼻子 |
        // 此时 cells[1]="○0/②" 含 /，应拆分为两个独立条目:
        //   条目1: jp=花, reading=はな, accent=○0, meaning=花
        //   条目2: jp=鼻, reading=はな, accent=②, meaning=鼻子
        // 按 "/" 直接分割 jpCell 和 meaningCell 配对
        // ==============================================================
        if (accentIdx >= 0 && /\//.test(cells[accentIdx])) {
          const accentParts = cells[accentIdx].split('/');
          const otherIdxs = [];
          for (let i = 0; i < total; i++) if (i !== accentIdx) otherIdxs.push(i);
          // reading: 其他列中唯一的假名/罗马字列
          let readingCol = -1;
          for (const idx of otherIdxs) {
            if (isReading(cells[idx])) { readingCol = idx; break; }
          }
          const reading = readingCol >= 0 ? cells[readingCol] : '';
          // 其余两列: 一个含 / 的 jpCell，一个是 meaningCell
          const remIdxs = otherIdxs.filter(i => i !== readingCol);
          let jpCell = '', meaningCell = '';
          for (const idx of remIdxs) {
            const v = cells[idx];
            if (v.includes('/')) { jpCell = v; }
            else { meaningCell = v; }
          }
          // jpCell="花/鼻", meaningCell="花/鼻子" → 直接按顺序配对
          const jpParts = jpCell ? jpCell.split('/') : [];
          const meaningParts = meaningCell ? meaningCell.split('/') : [];
          for (let i = 0; i < accentParts.length; i++) {
            const gj = jpParts[i] || jpParts[0] || '';
            const gm = meaningParts[i] || meaningParts[0] || '';
            const gr = reading;
            const ga = accentParts[i].trim();
            if (gj) all.push({ jp: gj, reading: gr || gj, accent: ga, pos: '', meaning: gm, lesson: realLesson, lessonTitle: lesson.title });
          }
          continue;
        }

        if (accentIdx >= 0) {
          // 找到了声调列，其他列就好判断了
          const otherIdxs = [];
          for (let i = 0; i < total; i++) if (i !== accentIdx) otherIdxs.push(i);

          // reading: 假名/罗马字
          for (const idx of otherIdxs) {
            if (isReading(cells[idx])) { reading = cells[idx]; break; }
          }
          // jp: 日文汉字 或 假名
          for (const idx of otherIdxs) {
            if (idx !== otherIdxs[0] || reading === '') {
              const v = cells[idx];
              if (/[々〆浬敷]/.test(v) || (v.length > 1 && /[一-鿿]/.test(v) && !isReading(v))) {
                jp = v; break;
              }
            }
          }
          // 如果还没找到jp，取剩余的最长的非声调非reading格
          if (!jp) {
            for (const idx of otherIdxs) {
              if (cells[idx] !== reading && cells[idx] !== '') {
                if (!jp) jp = cells[idx];
                else { meaning = cells[idx]; break; }
              }
            }
          }
          accent = cells[accentIdx];
        } else {
          // 没有声调列(3列表): 假名|日文汉字|中文意思
          // 用列名判断
          const hasColName = (names) => names.some(n => Object.values(curHeader).includes(cells.indexOf(n)) ? false : (curHeader[n] !== undefined));
          // 尝试用列名位置
          const jpIdx = curHeader['假名'] ?? curHeader['日文汉字'] ?? -1;
          const knIdx = curHeader['日文汉字'] ?? -1;
          const cnIdx = curHeader['中文意思'] ?? curHeader['中文'] ?? -1;

          if (jpIdx >= 0) jp = cells[jpIdx] || '';
          if (knIdx >= 0 && knIdx !== jpIdx) {
            const v = cells[knIdx] || '';
            if (/[々〆]/.test(v) || v.length > 1) { if (!jp) jp = v; else reading = v; }
          }
          if (cnIdx >= 0) meaning = cells[cnIdx] || '';

          // 如果meaning为空，尝试其他列
          if (!meaning) {
            for (let i = 0; i < total; i++) {
              if (i !== jpIdx && cells[i]) { meaning = cells[i]; break; }
            }
          }
          if (!jp && cells[0]) jp = cells[0];
          if (!meaning && cells[cells.length - 1]) meaning = cells[cells.length - 1];
        }

        // ==============================================================
        // 4列双词格式处理 (関連地名 / 関連語)
        // 格式A (関連地名): | 日文汉字 | 日文读音 | 日文汉字 | 日文读音 |
        //                    例: | 東京 | とうきょう | 北京 | ペキン |
        // 格式B (関連語):   | 日文 | 日文意思 | 日文 | 日文意思 |
        //                    例: | 香港 | 香港人 | 英語 | 香港ドル |
        // 格式C (地名混合):  | 汉字 | 假名读音 | 汉字 | 片假名 |
        //                    例: | 東京 | とうきょう | 北京 | ペキン |
        // 判断逻辑:
        //   col2含片假名 或 col2是外来语(含英文字母) → 格式B 関連語
        //   col2是纯汉字 → 格式A/C 関連地名
        // ==============================================================
        if (!jp && !reading && !accent && cells.length === 4) {
          const [a, b, c, d] = cells;
          // 格式B 関連語: col3 含片假名 或 col3 含英文字母(=外来语)
          const isKatakana = /[ァ-ンー]/.test(d);
          const isForeign = /[a-zA-Z]/.test(d);
          if (isKatakana || isForeign) {
            // 4列 関連語: [日文, 意思, 日文, 意思]
            if (a) all.push({ jp: a, reading: '', accent: '', pos: '', meaning: b, lesson: realLesson, lessonTitle: lesson.title });
            if (c) all.push({ jp: c, reading: '', accent: '', pos: '', meaning: d, lesson: realLesson, lessonTitle: lesson.title });
            continue;
          }
          // 格式A/C 関連地名: col2 和 col4 是纯汉字 → 两个独立地名条目
          const col2IsKanji = /^[\u4e00-\u9fa5ー〆々]+$/.test(c);
          if (col2IsKanji) {
            // col2 是纯汉字 → 两个条目各配对自己的读音
            // a/b 为一对 (jp, reading, meaning)
            if (a && b) all.push({ jp: a, reading: b, accent: '', pos: '', meaning: '', lesson: realLesson, lessonTitle: lesson.title });
            // c/d 为一对
            if (c && d) all.push({ jp: c, reading: d, accent: '', pos: '', meaning: '', lesson: realLesson, lessonTitle: lesson.title });
            continue;
          }
        }

        // 处理含 ＝/〒 的 4 列等价词格式: [jp1 jp2, meaning1, jp3 jp4, meaning2]
        // 例如: | 現在＝今 | 现在 | 未来＝将来 | 将来 |
        // 或者: | 始業式〒卒業式 | 开学典礼〒毕业典礼 |
        if (cells.length === 4) {
          const [a, b, c, d] = cells;
          const hasSep = /[＝\uff1d\u2100-\u214f]/.test(a) || /[＝\uff1d\u2100-\u214f]/.test(c);
          const hasSlash = /[／\/]/.test(a) || /[／\/]/.test(c);
          if (hasSep || hasSlash) {
            const sep = hasSep ? /[＝\uff1d\u2100-\u214f]/ : /[／\/]/;
            const partsA = a.split(sep).filter(Boolean);
            const partsC = c.split(sep).filter(Boolean);
            const partB = b.trim();
            const partD = d.trim();
            if (partsA.length > 1) {
              // 每半个作为一个词条，用相同的中文意思
              for (const p of partsA) {
                if (p && p.trim()) all.push({ jp: p.trim(), reading: '', accent: '', pos: '', meaning: partB, lesson: realLesson, lessonTitle: lesson.title });
              }
            } else if (partsA.length === 1 && partsA[0]) {
              all.push({ jp: partsA[0].trim(), reading: '', accent: '', pos: '', meaning: partB, lesson: realLesson, lessonTitle: lesson.title });
            }
            if (partsC.length > 1) {
              for (const p of partsC) {
                if (p && p.trim()) all.push({ jp: p.trim(), reading: '', accent: '', pos: '', meaning: partD, lesson: realLesson, lessonTitle: lesson.title });
              }
            } else if (partsC.length === 1 && partsC[0]) {
              all.push({ jp: partsC[0].trim(), reading: '', accent: '', pos: '', meaning: partD, lesson: realLesson, lessonTitle: lesson.title });
            }
            // 含 separator 的行不再走后续「関連地名」/ 「関連語」分支
            continue;
          }
        }
      } else if (cells.length === 3) {
        // 3 列: 假名|日文汉字|中文意思
        jp = cells[0] || '';
        const kn = cells[1] || '';
        meaning = cells[2] || '';
        if (/[々〆]/.test(kn) || kn.length > 1) reading = kn;
        else { reading = jp; jp = kn; }
        if (!jp) { jp = reading; reading = ''; }
      } else {
        continue;
      }

      if (!jp || !meaning) continue;

      // 修正经解析后 jp/reading 错位:
      // 如果 jp 是纯假名/外来语, reading 是汉字 → 交换
      // 例如: jp=ふろ, reading=風呂 → jp=風呂, reading=ふろ
      // 例如: jp=つうやく, reading=通訳 → jp=通訳, reading=つうやく
      // 例如: jp=せんせい, reading=先生 → jp=先生, reading=せんせい
      const jpIsKana = /^[ぁ-んァ-ンーa-zA-Z\-\s]+$/.test(jp);
      const readingIsKanji = /^[\u4e00-\u9fa5ー〆々]+$/.test(reading);
      if (jpIsKana && readingIsKanji && reading.length > 0 && reading !== jp) {
        [jp, reading] = [reading, jp];
      }

      all.push({
        jp, reading: reading || jp, accent, pos, meaning,
        lesson: realLesson, lessonTitle: lesson.title,
      });
    }
  }
  return all;
}

// ================================================================
// 2. 语法 grammar (与第一册相同)
// ================================================================
function parseGrammar(md) {
  const lessons = splitLessons(md);
  const out = [];
  for (const lesson of lessons) {
    let curEntry = null;
    for (const line of lesson.lines) {
      const entryHead = line.match(/^### (\d+)\.\s*(.+)$/);
      if (entryHead) {
        if (curEntry) out.push(curEntry);
        curEntry = {
          id: `g${lesson.num}-${entryHead[1]}`,
          lesson: lesson.num, lessonTitle: lesson.title,
          title: entryHead[2].trim(),
          pattern: '', explanation: '', examples: [], note: '',
        };
        continue;
      }
      if (!curEntry) continue;
      const patternMatch = line.match(/^- \*\*(.+?)\*\*/);
      if (patternMatch) {
        curEntry.pattern = patternMatch[1];
        curEntry.explanation = line.replace(/^- \*\*.+?\*\*[:\s]*/, '').trim();
        continue;
      }
      const exMatch = line.match(/^- (.+)$/);
      if (exMatch) {
        const body = exMatch[1];
        if (/[／\/]/.test(body)) {
          const parts = body.split(/[／\/]/).map((p) => p.trim()).filter(Boolean);
          const pairs = [];
          for (let i = 0; i + 1 < parts.length; i += 2) {
            const jp = parts[i].replace(/^例[:：]\s*/, '');
            const meaning = parts[i + 1];
            pairs.push({ jp, reading: '', meaning });
          }
          if (pairs.length === 0) {
            if (curEntry.explanation) curEntry.explanation += '\n' + body;
            else curEntry.explanation = body;
          } else {
            for (const p of pairs) curEntry.examples.push(p);
          }
        } else {
          if (curEntry.explanation) curEntry.explanation += '\n' + body;
          else curEntry.explanation = body;
        }
        continue;
      }
    }
    if (curEntry) out.push(curEntry);
  }
  for (const g of out) {
    for (const ex of g.examples) {
      ex.jp = ex.jp.replace(/\s*[（(][\u4e00-\u9fff][^）)]*[）)]\s*$/, '').trim();
      ex.reading = romajiOf(ex.jp);
    }
  }
  return out;
}

// ================================================================
// 3. 对话 dialogs (与第一册相同)
// ================================================================
function parseDialogs(md) {
  const lessons = splitLessons(md);
  const out = [];
  for (const lesson of lessons) {
    const dialog = { id: `${level.toLowerCase()}-d${lesson.num}`, lesson: lesson.num, title: lesson.title, scene: '', lines: [] };
    let pendingJP = null;
    let pendingSpeaker = null;
    for (const line of lesson.lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const sp = trimmed.match(/^([^：\s]+?)[:：]\s*(.+)$/);
      if (sp && /[ぁ-んァ-ン一-鿿]/.test(sp[2])) {
        pendingSpeaker = sp[1].trim();
        pendingJP = sp[2].trim();
        continue;
      }
      if (pendingJP && /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef、，。！？]/.test(trimmed)) {
        dialog.lines.push({
          speaker: pendingSpeaker,
          jp: pendingJP,
          reading: '',
          meaning: trimmed.replace(/\s*\/\s*/g, ''),
        });
        pendingJP = null;
        pendingSpeaker = null;
        continue;
      }
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
// 4. 短句 phrases (跳过,与第一册一样未使用)
// ================================================================
function parsePhrases(md) {
  return [];
}

// ================================================================
// 数据规范化
// ================================================================
function makeRomaji(reading) { return romajiOf(reading); }

function buildWords(vocabRaw) {
  const seen = new Set();
  const out = [];
  let i = 0;
  for (const v of vocabRaw) {
    if (!v.jp || !v.meaning) continue;
    const key = v.jp + '|' + v.meaning;
    if (seen.has(key)) continue;
    seen.add(key);

    // 如果 jp 是汉字，且 reading 为空或等于 jp，说明没有读音数据
    // 这种情况 swap 也没找到有效读音（汉字词无法自动推断读音）
    // reading 保留为空字符串，避免 quiz 用纯汉字作为「假名答案」
    let reading = v.reading;
    const jpIsKanji = /^[\u4e00-\u9fa5ー〆々]+$/.test(v.jp);
    if (jpIsKanji && (reading === '' || reading === v.jp)) {
      reading = '';
    }

    out.push({
      id: `${level.toLowerCase()}-w${String(++i).padStart(4, '0')}`,
      jp: v.jp,
      reading: reading || v.jp,
      romaji: makeRomaji(reading || v.jp),
      meaning: v.meaning,
      accent: v.accent,
      tag: [level, `第${v.lesson}課`, v.pos].filter(Boolean),
      lesson: v.lesson,
      note: v.pos ? `[${v.pos}]` : '',
    });
  }
  return out;
}
function buildGrammarEntries(grammarRaw) {
  return grammarRaw.map((g, i) => ({
    id: g.id || `${level.toLowerCase()}-g-${i}`,
    title: g.title, pattern: g.pattern, explanation: g.explanation,
    examples: g.examples.slice(0, 5),
    note: g.note || `第${g.lesson}課`,
  }));
}
function buildDialogs(dialogsRaw) {
  return dialogsRaw.map((d) => ({
    id: d.id, title: d.title, scene: d.scene,
    lines: d.lines.map((l) => ({ ...l, reading: makeRomaji(l.jp) })),
  }));
}

// ================================================================
// Quiz / Listening 派生
// ================================================================
function buildQuiz(words, dialogs) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const distractors = shuffle(words.filter((x) => x.id !== w.id)).slice(0, 3);
    const opts1 = shuffle([w.meaning, ...distractors.map((d) => d.meaning)]);
    out.push({ id: `${w.id}-c1`, type: 'choice', question: `「${w.jp}」是什么意思?`, options: opts1, answerIndex: opts1.indexOf(w.meaning), explanation: `${w.jp} = ${w.meaning} (${w.reading})` });
    const opts2 = shuffle([w.meaning, ...distractors.map((d) => d.meaning)]);
    out.push({ id: `${w.id}-l1`, type: 'listening', audio: w.jp, question: '听到的词是什么意思?', options: opts2, answerIndex: opts2.indexOf(w.meaning), explanation: `${w.jp} = ${w.meaning}` });
    const opts3 = shuffle([w.jp, ...distractors.map((d) => d.jp)]);
    out.push({ id: `${w.id}-c2`, type: 'choice', question: `「${w.meaning}」的日文是?`, options: opts3, answerIndex: opts3.indexOf(w.jp), explanation: `${w.meaning} = ${w.jp} (${w.reading})` });
    const opts4 = shuffle([w.reading, ...distractors.map((d) => d.reading)]);
    out.push({ id: `${w.id}-c3`, type: 'choice', question: `「${w.jp}」的读音是?`, options: opts4, answerIndex: opts4.indexOf(w.reading), explanation: `${w.jp} = ${w.reading}` });
    out.push({ id: `${w.id}-s1`, type: 'spelling', prompt: w.jp, question: '请写出读音(假名)', answer: w.reading, answerFormat: 'hiragana', explanation: `${w.jp} = ${w.reading} (${w.meaning})` });
    out.push({ id: `${w.id}-sa1`, type: 'spell-audio', audio: w.jp, question: '听音频,写出假名', answer: w.reading, answerFormat: 'hiragana', explanation: `${w.jp} = ${w.reading} (${w.meaning})` });
  }
  for (const d of dialogs) {
    for (let i = 0; i < d.lines.length; i++) {
      const line = d.lines[i];
      const distractors = shuffle(d.lines.filter((l) => l.jp !== line.jp)).slice(0, 3);
      const opts = shuffle([line.meaning, ...distractors.map((l) => l.meaning)]);
      out.push({ id: `${d.id}-l${i + 1}`, type: 'listening', audio: line.jp, question: `「${d.title}」中的句子是什么意思?`, options: opts, answerIndex: opts.indexOf(line.meaning), explanation: `${line.speaker}: ${line.jp} = ${line.meaning}` });
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
    out.push({ id: `${level.toLowerCase()}-l${String(i + 1).padStart(4, '0')}`, audio: w.jp, question: '听到的词是什么意思?', answer: w.meaning, options: opts, answerIndex: opts.indexOf(w.meaning), explanation: `${w.jp} = ${w.meaning} (${w.reading})` });
  }
  for (const d of dialogs) {
    for (let i = 0; i < Math.min(d.lines.length, 6); i++) {
      const line = d.lines[i];
      const distractors = shuffle(d.lines.filter((l) => l.jp !== line.jp)).slice(0, 3);
      const opts = shuffle([line.meaning, ...distractors.map((l) => l.meaning)]);
      out.push({ id: `${d.id}-L${i + 1}`, audio: line.jp, question: `「${d.title}」${line.speaker}说的是什么?`, answer: line.meaning, options: opts, answerIndex: opts.indexOf(line.meaning), explanation: `${line.speaker}: ${line.jp}` });
    }
  }
  return out;
}

// ================================================================
// Main
// ================================================================
function main() {
  console.log(`📚  解析「${VOL_TITLE}」(${level})...\n`);

  const vocabMD = readMD(FILES.vocab);
  const grammarMD = readMD(FILES.grammar);
  const dialogsMD = readMD(FILES.dialogs);
  const phrasesMD = readMD(FILES.phrases);

  const vocabRaw = parseVocab(vocabMD);
  const grammarRaw = parseGrammar(grammarMD);
  const dialogsRaw = parseDialogs(dialogsMD);
  parsePhrases(phrasesMD);

  console.log(`  单词解析: ${vocabRaw.length} 条`);
  console.log(`  语法解析: ${grammarRaw.length} 条`);
  console.log(`  对话解析: ${dialogsRaw.length} 段 (含 ${dialogsRaw.reduce((s, d) => s + d.lines.length, 0)} 行)`);

  const words = buildWords(vocabRaw);
  const grammar = buildGrammarEntries(grammarRaw);
  const dialogs = buildDialogs(dialogsRaw);
  const quiz = buildQuiz(words, dialogs);
  const listening = buildListening(words, dialogs);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'words.json'), JSON.stringify(words, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'grammar.json'), JSON.stringify(grammar, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'dialogs.json'), JSON.stringify(dialogs, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'listening.json'), JSON.stringify(listening, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, 'quiz.json'), JSON.stringify(quiz, null, 2) + '\n');

  // 更新 scenarios-index.json (按 level 选配置)
  const LEVEL_INFO = {
    N5: { emoji: '📘', color: 'from-indigo-500 via-blue-500 to-sky-500', subtitle: 'JLPT N5 / 标准日语初级上',
           desc: '五十音图入门到基础语法', prev: '适合零基础起步到 N5 备考',
           goals: ['掌握 50 音图 + 浊音/半浊音/拗音/长音/促音', '学会约 500+ 基础词汇', '掌握 N5 必考语法', '能听懂日常寒暄和自我介绍', '能读懂简单日语会话文和文章'] },
    N4: { emoji: '📗', color: 'from-violet-500 via-purple-500 to-fuchsia-500', subtitle: 'JLPT N4 / 标准日语初级下',
           desc: '中级日语表达,敬语/使役/被动/复合句等', prev: '适合有 N5 基础到 N4 备考',
           goals: ['掌握中级日语词汇(动词变形/名词复合/敬语等)', '熟练 200+ 中级语法(〜てあげる/〜てもらう/使役/被动/假定等)', '能进行日常话题讨论(旅行/健康/文化/工作)', '能理解中等难度会话文和短文'] },
    N3: { emoji: '📙', color: 'from-amber-500 via-orange-500 to-red-500', subtitle: 'JLPT N3 / 标准日语中级上',
           desc: '中高级语法,条件/样态/授受/复合句/书面表达等', prev: '适合有 N4 基础到 N3 备考',
           goals: ['掌握约 1500+ 中级词汇', '熟练 N3 必考语法(条件句/样态/授受/复合句)', '能阅读中等长度新闻/说明文', '能听懂日常新闻和中等语速对话', '能写 300 字以上的日语短文'] },
    N2: { emoji: '📕', color: 'from-rose-500 via-pink-500 to-fuchsia-600', subtitle: 'JLPT N2 / 标准日语中级下',
           desc: '高级日语,书面/口语综合,社会/文化/学术话题', prev: '适合有 N3 基础到 N2 备考',
           goals: ['掌握约 3000+ 中高级词汇', '熟练 N2 必考语法(书面语/敬语/复杂句式)', '能阅读社论/评论/学术类文章', '能听懂新闻报道/采访/演讲', '能写 500 字以上的日语文章'] },
  };
  const info = LEVEL_INFO[level] || LEVEL_INFO.N4;
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
  const meta = {
    id: SCENE_ID,
    title: `${VOL_TITLE} (${level})`,
    subtitle: info.subtitle,
    emoji: info.emoji,
    color: info.color,
    category: 'exam',
    description: `${VOL_TITLE}全文:${info.desc},含 20 课单词、语法点、会话文和文章,${info.prev}。`,
    goals: info.goals,
  };
  if (!idx.find((s) => s.id === SCENE_ID)) {
    idx.push(meta);
    fs.writeFileSync(INDEX_PATH, JSON.stringify(idx, null, 2) + '\n');
    console.log(`\n✅ scenarios-index.json 已添加 ${SCENE_ID}`);
  }

  console.log(`\n✅ words.json: ${words.length} 词`);
  console.log(`✅ grammar.json: ${grammar.length} 句型`);
  console.log(`✅ dialogs.json: ${dialogs.length} 段对话`);
  console.log(`✅ listening.json: ${listening.length} 题`);
  console.log(`✅ quiz.json: ${quiz.length} 题`);

  const byLesson = {};
  for (const w of words) byLesson[w.lesson] = (byLesson[w.lesson] || 0) + 1;
  console.log(`\n单词按课分布: ${Object.entries(byLesson).map(([k, v]) => `第${k}課(${v})`).join(', ')}`);
}

main();