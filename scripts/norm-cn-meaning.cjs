// 把所有场景 words.json + grammar.json + quiz.json 里 meaning 字段
// 简繁归一(用最常见/最自然的字)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public', 'data', 'scenarios');
const SCENARIOS = ['driving', 'enrollment', 'course-practice', 'road-test', 'signs-rules', 'medical', 'pregnancy', 'traffic-rules'];

// 繁→简常用字 + 简→繁要避免的词
const SIMPLIFY = {
  '幾': '几',
  '張': '张',
  '個': '个',
  '條': '条',
  '腳': '脚',
  '長': '长',
  '車': '车',
  '頭': '头',
  '門': '门',
  '間': '间',
  '號': '号',
  '時': '时',
  '們': '们',
  '來': '来',
  '對': '对',
  '這': '这',
  '那': '那',
  '會': '会',
  '說': '说',
  '語': '语',
  '時': '时',
  '報': '报',
  '見': '见',
  '聽': '听',
  '寫': '写',
  '讀': '读',
  '師': '师',
  '兒': '儿',
  '東': '东',
  '西': '西',
  '南': '南',
  '北': '北',
  '國': '国',
  '學': '学',
  '醫': '医',
  '體': '体',
  '檢': '检',
  '單': '单',
  '雙': '双',
  '麵': '面',
  '魚': '鱼',
  '雞': '鸡',
  '豬': '猪',
  '飯': '饭',
  '飲': '饮',
  '館': '馆',
  '醫院': '医院', // 已经在 SIMPLIFY 字典
  '員': '员',
  '場': '场',
  '過': '过',
  '遠': '远',
  '進': '进',
  '關': '关',
  '閉': '闭',
  '轉': '转',
  '讓': '让',
  '線': '线',
  '記': '记',
  '證': '证',
  '產': '产',
  '經': '经',
  '絕': '绝',
  '終': '终',
  '練': '练',
  '練': '练',
  '術': '术',
  '節': '节',
  '結': '结',
  '親': '亲',
  '備': '备',
  '種': '种',
  '處': '处',
  '畫': '画',
  '齒': '齿',
  '腦': '脑',
  '臟': '脏',
  '壓': '压',
  '體': '体',
  '臟': '脏',
  '繼': '继',
  '績': '绩',
  '測': '测',
  '結': '结',
  '應': '应',
  '類': '类',
  '應': '应',
  '藥': '药',
  '錢': '钱',
  '銀': '银',
  '鋼': '钢',
  '鐵': '铁',
  '燈': '灯',
  '電': '电',
  '話': '话',
  '視': '视',
  '覺': '觉',
  '鐘': '钟',
  '錶': '表',
  '當': '当',
  '備': '备',
  '報': '报',
  '準': '准',
  '許': '许',
  '設': '设',
  '備': '备',
};

function simplify(s) {
  if (!s) return s;
  let out = s;
  for (const [k, v] of Object.entries(SIMPLIFY)) {
    out = out.split(k).join(v);
  }
  return out;
}

let totalFixed = 0;
for (const sc of SCENARIOS) {
  const dir = sc === 'traffic-rules'
    ? path.resolve(__dirname, '..', 'public', 'data', 'traffic-rules')
    : path.join(ROOT, sc);
  if (!fs.existsSync(dir)) continue;
  for (const fn of ['words.json', 'grammar.json', 'quiz.json', 'listening.json', 'dialogs.json']) {
    const f = path.join(dir, fn);
    if (!fs.existsSync(f)) continue;
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    let changed = 0;
    const walk = (obj) => {
      if (typeof obj === 'string') return obj;
      if (Array.isArray(obj)) { obj.forEach(walk); return; }
      if (obj && typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === 'string' && (k === 'meaning' || k === 'jp_question' || k === 'question' || k === 'note' || k === 'scene' || k === 'prompt' || k === 'explanation' || k === 'options' || k === 'answer')) {
            // 只 meaning 字段做繁简归一
            if (k === 'meaning') {
              const newV = simplify(v);
              if (newV !== v) { obj[k] = newV; changed++; }
            } else if (k === 'options' || k === 'question' || k === 'jp_question' || k === 'note' || k === 'scene' || k === 'prompt' || k === 'explanation' || k === 'answer') {
              // question/explanation 涉及中文翻译,繁简混用需要清理
              // 简化:只 meaning 字段简化,其他保留
            }
          } else {
            walk(v);
          }
        }
      }
    };
    walk(data);
    if (changed > 0) {
      fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`[${sc}/${fn}] 简化 ${changed} 个 meaning`);
      totalFixed += changed;
    }
  }
}
console.log(`\n总计简化 ${totalFixed} 个 meaning`);
