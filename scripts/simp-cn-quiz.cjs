// 在 quiz.json / listening.json / dialogs.json / words.json / grammar.json 里
// 简繁归一中文 meaning / note / question / explanation 等字段中的繁体字
// 直接在文件层面做 string 替换(覆盖所有可能含繁体的位置)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public', 'data');

// 简→繁(包含一些常用词的繁简对照)
const MAP = {
  '幾': '几', '張': '张', '個': '个', '條': '条', '腳': '脚', '長': '长',
  '車': '车', '頭': '头', '門': '门', '間': '间', '號': '号', '時': '时',
  '們': '们', '來': '来', '對': '对', '這': '这', '會': '会', '說': '说',
  '語': '语', '時': '时', '報': '报', '見': '见', '聽': '听', '寫': '写',
  '讀': '读', '師': '师', '兒': '儿', '東': '东', '西': '西', '南': '南',
  '北': '北', '國': '国', '學': '学', '醫': '医', '體': '体', '檢': '检',
  '單': '单', '雙': '双', '麵': '面', '魚': '鱼', '雞': '鸡', '豬': '猪',
  '飯': '饭', '飲': '饮', '館': '馆', '員': '员', '場': '场', '過': '过',
  '遠': '远', '進': '进', '關': '关', '閉': '闭', '轉': '转', '讓': '让',
  '線': '线', '記': '记', '證': '证', '產': '产', '經': '经', '絕': '绝',
  '終': '终', '練': '练', '術': '术', '節': '节', '結': '结', '親': '亲',
  '備': '备', '種': '种', '處': '处', '畫': '画', '齒': '齿', '腦': '脑',
  '臟': '脏', '壓': '压', '繼': '继', '績': '绩', '測': '测', '應': '应',
  '類': '类', '藥': '药', '錢': '钱', '銀': '银', '鋼': '钢', '鐵': '铁',
  '燈': '灯', '電': '电', '話': '话', '視': '视', '覺': '觉', '鐘': '钟',
  '錶': '表', '當': '当', '準': '准', '許': '许', '設': '设', '驅': '驱',
  '動': '动', '紀': '纪', '錄': '录', '嬰': '婴', '兒': '儿', '兒': '儿',
  '體': '体', '後': '后', '前': '前', '間': '间', '離': '离', '點': '点',
  '計': '计', '劃': '划', '達': '达', '隨': '随', '導': '导', '專': '专',
  '業': '业', '級': '级', '學': '学', '歷': '历', '史': '史', '畫': '画',
  '術': '术', '證': '证', '帶': '带', '導': '导', '準': '准', '備': '备',
  '傷': '伤', '產': '产', '婦': '妇', '產': '产', '懷': '怀', '孕': '孕',
  '產': '产', '嬰': '婴', '兒': '儿', '聲': '声', '響': '响', '視': '视',
  '聽': '听', '觸': '触', '覺': '觉', '機': '机', '構': '构', '決': '决',
  '議': '议', '質': '质', '據': '据', '處': '处', '罰': '罚', '規': '规',
  '則': '则', '達': '达', '錯': '错', '誤': '误', '遲': '迟', '延': '延',
  '遲': '迟', '幾': '几', '歷': '历', '極': '极', '限': '限', '達': '达',
  '際': '际', '帶': '带', '衝': '冲', '突': '突', '預': '预', '測': '测',
  '純': '纯', '淨': '净', '歸': '归', '納': '纳', '從': '从', '舊': '旧',
  '換': '换', '與': '与', '萬': '万', '億': '亿', '餘': '余', '幾': '几',
  '費': '费', '額': '额', '銀': '银', '兩': '两', '種': '种', '類': '类',
};

const KEYS = Object.keys(MAP).sort((a, b) => b.length - a.length); // 长 key 优先

function simplify(s) {
  let out = s;
  for (const k of KEYS) {
    if (out.indexOf(k) >= 0) out = out.split(k).join(MAP[k]);
  }
  return out;
}

function walk(obj) {
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) { obj.forEach(walk); return; }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string' && (
        k === 'meaning' || k === 'note' || k === 'scene' || k === 'explanation' ||
        k === 'options' || k === 'question' || k === 'jp_question' || k === 'prompt' ||
        k === 'answer' || k === 'description' || k === 'title' || k === 'subtitle'
      )) {
        const newV = simplify(v);
        if (newV !== v) obj[k] = newV;
      } else {
        walk(v);
      }
    }
  }
}

let total = 0;
function processFile(p) {
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const before = JSON.stringify(data).length;
  walk(data);
  const after = JSON.stringify(data).length;
  if (before !== after) {
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`[${path.relative(ROOT, p)}] simplified`);
    total++;
  }
}

function walkDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f === 'images') continue;
      walkDir(full);
    } else if (f.endsWith('.json')) {
      processFile(full);
    }
  }
}

walkDir(ROOT);
console.log(`\n共清理 ${total} 个文件`);
