// 从 quiz.json 提取的补全词表,追加到 traffic-rules/words.json
// 保留所有现有词,只追加新词
const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'public', 'data', 'scenarios', 'traffic-rules', 'words.json');
const existing = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
const existingSet = new Set(existing.map((w) => w.jp));

const additions = [
  // ============ 法规核心动词 (高频) ============
  {"id":"tr-w179","jp":"通行","reading":"つうこう","romaji":"tsuukou","meaning":"通行","note":"法 62 / 行 38","tag":["动词"]},
  {"id":"tr-w180","jp":"標識","reading":"ひょうしき","romaji":"hyoushiki","meaning":"标志","note":"法 58 / 行 38","tag":["术语"]},
  {"id":"tr-w181","jp":"道路","reading":"どうろ","romaji":"douro","meaning":"道路","note":"道 52","tag":["术语"]},
  {"id":"tr-w182","jp":"自動車","reading":"じどうしゃ","romaji":"jidousha","meaning":"汽车","note":"题 40","tag":["车辆"]},
  {"id":"tr-w183","jp":"運転","reading":"うんてん","romaji":"unten","meaning":"驾驶","note":"题 38","tag":["动作"]},
  {"id":"tr-w184","jp":"停止","reading":"ていし","romaji":"teishi","meaning":"停止","note":"题 30","tag":["动作"]},
  {"id":"tr-w185","jp":"自転車","reading":"じてんしゃ","romaji":"jitensha","meaning":"自行车","note":"题 29","tag":["车辆"]},
  {"id":"tr-w186","jp":"安全","reading":"あんぜん","romaji":"anzen","meaning":"安全","note":"题 27","tag":["术语"]},
  {"id":"tr-w187","jp":"禁止","reading":"きんし","romaji":"kinshi","meaning":"禁止","note":"题 24","tag":["术语"]},
  {"id":"tr-w188","jp":"右折","reading":"うせつ","romaji":"usetsu","meaning":"右转","note":"题 19","tag":["动作"]},
  {"id":"tr-w189","jp":"必要","reading":"ひつよう","romaji":"hitsuyou","meaning":"必要","note":"题 19","tag":["术语"]},
  {"id":"tr-w190","jp":"信号","reading":"しんごう","romaji":"shingou","meaning":"信号","note":"题 19","tag":["信号"]},
  {"id":"tr-w191","jp":"手前","reading":"てまえ","romaji":"temae","meaning":"前方/前面","note":"题 18","tag":["术语"]},
  {"id":"tr-w192","jp":"交通","reading":"こうつう","romaji":"koutsuu","meaning":"交通","note":"题 18","tag":["术语"]},
  {"id":"tr-w193","jp":"発進","reading":"はっしん","romaji":"hasshin","meaning":"起步","note":"题 16","tag":["动作"]},
  {"id":"tr-w194","jp":"進行","reading":"しんこう","romaji":"shinkou","meaning":"行进","note":"题 16","tag":["动作"]},
  {"id":"tr-w195","jp":"速度","reading":"そくど","romaji":"sokudo","meaning":"速度","note":"题 13","tag":["术语"]},
  {"id":"tr-w196","jp":"路線","reading":"ろせん","romaji":"rosen","meaning":"路线","note":"题 12","tag":["术语"]},
  {"id":"tr-w197","jp":"場所","reading":"ばしょ","romaji":"basho","meaning":"场所","note":"题 12","tag":["术语"]},
  {"id":"tr-w198","jp":"前方","reading":"ぜんぽう","romaji":"zenpou","meaning":"前方","note":"题 12","tag":["术语"]},
  {"id":"tr-w199","jp":"注意","reading":"ちゅうい","romaji":"chuu-i","meaning":"注意","note":"题 11","tag":["术语"]},
  {"id":"tr-w200","jp":"左折","reading":"させつ","romaji":"sasetsu","meaning":"左转","note":"题 11","tag":["动作"]},
  {"id":"tr-w201","jp":"右側","reading":"みぎがわ","romaji":"migi-gawa","meaning":"右侧","note":"题 10","tag":["术语"]},
  {"id":"tr-w202","jp":"危険","reading":"きけん","romaji":"kiken","meaning":"危险","note":"题 10","tag":["术语"]},
  {"id":"tr-w203","jp":"免許","reading":"めんきょ","romaji":"menkyo","meaning":"驾照","note":"题 10","tag":["术语"]},
  {"id":"tr-w204","jp":"横断","reading":"おうだん","romaji":"oudan","meaning":"横穿","note":"题 7","tag":["动作"]},
  {"id":"tr-w205","jp":"原則","reading":"げんそく","romaji":"gensoku","meaning":"原则","note":"题 7","tag":["术语"]},
  {"id":"tr-w206","jp":"通過","reading":"つうか","romaji":"tsuuka","meaning":"通过","note":"题 7","tag":["动作"]},
  {"id":"tr-w207","jp":"対面","reading":"たいめん","romaji":"taimen","meaning":"对面","note":"题 7","tag":["术语"]},
  {"id":"tr-w208","jp":"後退","reading":"こうたい","romaji":"koutai","meaning":"后退","note":"题 7","tag":["动作"]},
  {"id":"tr-w209","jp":"確認","reading":"かくにん","romaji":"kakunin","meaning":"确认","note":"题 6","tag":["动作"]},
  {"id":"tr-w210","jp":"内側","reading":"うちがわ","romaji":"uchi-gawa","meaning":"内侧","note":"题 6","tag":["术语"]},
  {"id":"tr-w211","jp":"正面","reading":"しょうめん","romaji":"shoumen","meaning":"正面","note":"题 6","tag":["术语"]},
  {"id":"tr-w212","jp":"意味","reading":"いみ","romaji":"imi","meaning":"意思/意义","note":"题 6","tag":["术语"]},
  {"id":"tr-w213","jp":"走行","reading":"そうこう","romaji":"soukou","meaning":"行驶","note":"题 6","tag":["动作"]},
  {"id":"tr-w214","jp":"義務","reading":"ぎむ","romaji":"gimu","meaning":"义务","note":"题 5","tag":["术语"]},
  {"id":"tr-w215","jp":"距離","reading":"きょり","romaji":"kyori","meaning":"距离","note":"题 5","tag":["术语"]},
  {"id":"tr-w216","jp":"矢印","reading":"やじるし","romaji":"yajirushi","meaning":"箭头","note":"题 5","tag":["术语"]},
  {"id":"tr-w217","jp":"方向","reading":"ほうこう","romaji":"houkou","meaning":"方向","note":"题 5","tag":["术语"]},
  {"id":"tr-w218","jp":"表示","reading":"ひょうじ","romaji":"hyouji","meaning":"表示","note":"题 5","tag":["术语"]},
  {"id":"tr-w219","jp":"路面","reading":"ろめん","romaji":"romen","meaning":"路面","note":"题 5","tag":["术语"]},
  {"id":"tr-w220","jp":"指定","reading":"してい","romaji":"shitei","meaning":"指定","note":"题 5","tag":["术语"]},
  {"id":"tr-w221","jp":"部分","reading":"ぶぶん","romaji":"bubun","meaning":"部分","note":"题 5","tag":["术语"]},
  {"id":"tr-w222","jp":"位置","reading":"いち","romaji":"ichi","meaning":"位置","note":"题 5","tag":["术语"]},
  {"id":"tr-w223","jp":"間隔","reading":"かんかく","romaji":"kankaku","meaning":"间隔","note":"题 4","tag":["术语"]},
  {"id":"tr-w224","jp":"練習","reading":"れんしゅう","romaji":"renshuu","meaning":"练习","note":"题 4","tag":["动作"]},
  {"id":"tr-w225","jp":"場合","reading":"ばあい","romaji":"baai","meaning":"情况","note":"题 4","tag":["术语"]},

  // ============ 4字复合词 ============
  {"id":"tr-w226","jp":"警察官","reading":"けいさつかん","romaji":"keisatsu-kan","meaning":"警察","note":"题 23","tag":["人员"]},
  {"id":"tr-w227","jp":"運転免許","reading":"うんてんめんきょ","romaji":"unten menkyo","meaning":"驾照","note":"题 18","tag":["术语"]},
  {"id":"tr-w228","jp":"普通自動車","reading":"ふつうじどうしゃ","romaji":"futsuu jidousha","meaning":"普通汽车","note":"题 15","tag":["车辆"]},
  {"id":"tr-w229","jp":"緊急自動車","reading":"きんきゅうじどうしゃ","romaji":"kinkyuu jidousha","meaning":"紧急车辆","note":"题 7","tag":["车辆"]},
  {"id":"tr-w230","jp":"道路標識","reading":"どうろひょうしき","romaji":"douro hyoushiki","meaning":"道路标志","note":"题 5","tag":["标志"]},
  {"id":"tr-w231","jp":"交通整理","reading":"こうつうせいり","romaji":"koutsuu seiri","meaning":"交通指挥","note":"题 9","tag":["术语"]},
  {"id":"tr-w232","jp":"安全確認","reading":"あんぜんかくにん","romaji":"anzen kakunin","meaning":"安全确认","note":"题 9","tag":["动作"]},
  {"id":"tr-w233","jp":"仮免許","reading":"かりめんきょ","romaji":"karimenkyo","meaning":"临时驾照","note":"题 7","tag":["术语"]},
  {"id":"tr-w234","jp":"通学通園","reading":"つがくつうえん","romaji":"tsuugaku tsuuen","meaning":"上學/上幼儿园","note":"题 7","tag":["术语"]},
  {"id":"tr-w235","jp":"車両通行帯","reading":"しゃりょうつうこうたい","romaji":"sharyou tsuukoutai","meaning":"行车道","note":"题 27","tag":["道路"]},
  {"id":"tr-w236","jp":"自転車横断帯","reading":"じてんしゃおうだんたい","romaji":"jitensha oudantai","meaning":"自行车横穿带","note":"题 12","tag":["道路"]},
  {"id":"tr-w237","jp":"普通免許","reading":"ふつうめんきょ","romaji":"futsuu menkyo","meaning":"普通驾照","note":"题 10","tag":["术语"]},
  {"id":"tr-w238","jp":"原動機付自転車","reading":"げんどうきつきじてんしゃ","romaji":"gendouki-tsuki jitensha","meaning":"原付","note":"原付的全称","tag":["车辆"]},
  {"id":"tr-w239","jp":"手信号","reading":"てしんごう","romaji":"te shingou","meaning":"手信号","note":"题 7","tag":["术语"]},
  {"id":"tr-w240","jp":"進路変更","reading":"しんろへんこう","romaji":"shinro henkou","meaning":"变道","note":"题 11","tag":["动作"]},
  {"id":"tr-w241","jp":"法定最高速度","reading":"ほうていさいこうそくど","romaji":"houtei saikou sokudo","meaning":"法定最高速度","note":"题 8","tag":["术语"]},

  // ============ 设施 / 标识 / 标志相关 ============
  {"id":"tr-w242","jp":"黄色の灯火","reading":"きいろのとうか","romaji":"kiiro no touka","meaning":"黄色灯","note":"信号机","tag":["信号"]},
  {"id":"tr-w243","jp":"赤色の灯火","reading":"あかいろのとうか","romaji":"akairo no touka","meaning":"红色灯","note":"信号机","tag":["信号"]},
  {"id":"tr-w244","jp":"青色の灯火","reading":"あおいろのとうか","romaji":"aoiro no touka","meaning":"绿色灯","note":"信号机","tag":["信号"]},
  {"id":"tr-w245","jp":"矢印信号","reading":"やじるししんごう","romaji":"yajirushi shingou","meaning":"箭头信号","note":"方向专用","tag":["信号"]},
  {"id":"tr-w246","jp":"規制標識","reading":"きせいひょうしき","romaji":"kisei hyoushiki","meaning":"規制标志","note":"题 5","tag":["标志"]},
  {"id":"tr-w247","jp":"指示標識","reading":"しじひょうしき","romaji":"shiji hyoushiki","meaning":"指示标志","note":"题 5","tag":["标志"]},
  {"id":"tr-w248","jp":"警戒標識","reading":"けいかいひょうしき","romaji":"keikai hyoushiki","meaning":"警告标志","note":"题 5","tag":["标志"]},
  {"id":"tr-w249","jp":"案内標識","reading":"あんないひょうしき","romaji":"annai hyoushiki","meaning":"指路标志","note":"题 5","tag":["标志"]},
  {"id":"tr-w250","jp":"中央線","reading":"ちゅうおうせん","romaji":"chuuou sen","meaning":"中央线","note":"题 5","tag":["道路"]},
  {"id":"tr-w251","jp":"車線","reading":"しゃせん","romaji":"shasen","meaning":"车道","note":"题 4","tag":["道路"]},
  {"id":"tr-w252","jp":"進路","reading":"しんろ","romaji":"shinro","meaning":"行进方向","note":"题 4","tag":["术语"]},

  // ============ 法规核心动词 / 句型常用词 ============
  {"id":"tr-w253","jp":"示す","reading":"しめす","romaji":"shimesu","meaning":"表示","note":"题 8","tag":["动词"]},
  {"id":"tr-w254","jp":"表す","reading":"あらわす","romaji":"arawasu","meaning":"表达","note":"题 4","tag":["动词"]},
  {"id":"tr-w255","jp":"行う","reading":"おこなう","romaji":"okonau","meaning":"进行","note":"题 4","tag":["动词"]},
  {"id":"tr-w256","jp":"受ける","reading":"うける","romaji":"ukeru","meaning":"接受","note":"题 4","tag":["动词"]},
  {"id":"tr-w257","jp":"含む","reading":"ふくむ","romaji":"fukumu","meaning":"包含","note":"题 3","tag":["动词"]},
  {"id":"tr-w258","jp":"除く","reading":"のぞく","romaji":"nozoku","meaning":"除","note":"题 3","tag":["动词"]},
  {"id":"tr-w259","jp":"限る","reading":"かぎる","romaji":"kagiru","meaning":"限定","note":"题 3","tag":["动词"]},
  {"id":"tr-w260","jp":"通る","reading":"とおる","romaji":"tooru","meaning":"通过","note":"题 3","tag":["动词"]},
  {"id":"tr-w261","jp":"超える","reading":"こえる","romaji":"koeru","meaning":"超过","note":"题 3","tag":["动词"]},
  {"id":"tr-w262","jp":"守る","reading":"まもる","romaji":"mamoru","meaning":"遵守","note":"题 3","tag":["动词"]},
  {"id":"tr-w263","jp":"守る","reading":"まもる","romaji":"mamoru","meaning":"遵守","note":"","tag":["动词"]},
  {"id":"tr-w264","jp":"守らない","reading":"まもらない","romaji":"mamoranai","meaning":"不遵守","note":"","tag":["动词"]},
  {"id":"tr-w265","jp":"行う","reading":"おこなう","romaji":"okonau","meaning":"进行","note":"","tag":["动词"]},
  {"id":"tr-w266","jp":"行わない","reading":"おこなわない","romaji":"okonawanai","meaning":"不进行","note":"","tag":["动词"]},
  {"id":"tr-w267","jp":"保つ","reading":"たもつ","romaji":"tamotsu","meaning":"保持","note":"题 3","tag":["动词"]},
  {"id":"tr-w268","jp":"妨げる","reading":"さまたげる","romaji":"samatageru","meaning":"妨碍","note":"题 4","tag":["动词"]},
  {"id":"tr-w269","jp":"譲る","reading":"ゆずる","romaji":"yuzuru","meaning":"让","note":"题 3","tag":["动词"]},
  {"id":"tr-w270","jp":"寄る","reading":"よる","romaji":"yoru","meaning":"靠近","note":"题 3","tag":["动词"]},
  {"id":"tr-w271","jp":"鳴る","reading":"なる","romaji":"naru","meaning":"鸣响","note":"题 3","tag":["动词"]},
  {"id":"tr-w272","jp":"鳴らす","reading":"ならす","romaji":"narasu","meaning":"鸣","note":"题 3","tag":["动词"]},

  // ============ 形容词 / 副词 / 常用副词 ============
  {"id":"tr-w273","jp":"あらかじめ","reading":"あらかじめ","romaji":"arakajime","meaning":"提前/预先","note":"题 6","tag":["副词"]},
  {"id":"tr-w274","jp":"必ず","reading":"かならず","romaji":"kanarazu","meaning":"必须/一定","note":"题 4","tag":["副词"]},
  {"id":"tr-w275","jp":"できるだけ","reading":"できるだけ","romaji":"dekiru dake","meaning":"尽量","note":"题 3","tag":["副词"]},
  {"id":"tr-w276","jp":"できる限り","reading":"できるかぎり","romaji":"dekiru kagiri","meaning":"尽可能","note":"题 3","tag":["副词"]},
  {"id":"tr-w277","jp":"徐々","reading":"じょじょ","romaji":"jojo","meaning":"逐渐","note":"题 3","tag":["副词"]},
  {"id":"tr-w278","jp":"同様","reading":"どうよう","romaji":"douyou","meaning":"同样","note":"题 3","tag":["副词"]},
  {"id":"tr-w279","jp":"同様","reading":"どうよう","romaji":"douyou","meaning":"同样","note":"","tag":["副词"]},

  // ============ 句型词 / 接续词 ============
  {"id":"tr-w280","jp":"したがって","reading":"したがって","romaji":"shitagatte","meaning":"因此/所以","note":"题 3","tag":["接续"]},
  {"id":"tr-w281","jp":"ただし","reading":"ただし","romaji":"tadashi","meaning":"但是/不过","note":"题 4","tag":["接续"]},
  {"id":"tr-w282","jp":"また","reading":"また","romaji":"mata","meaning":"又/另外","note":"题 5","tag":["接续"]},
  {"id":"tr-w283","jp":"および","reading":"および","romaji":"oyobi","meaning":"以及","note":"题 3","tag":["接续"]},
  {"id":"tr-w284","jp":"やむを得ない","reading":"やむをえない","romaji":"yamu wo enai","meaning":"不得已","note":"题 5","tag":["句型"]},
  {"id":"tr-w285","jp":"その","reading":"その","romaji":"sono","meaning":"那个","note":"题 8","tag":["连体"]},
  {"id":"tr-w286","jp":"このような","reading":"このような","romaji":"kono you na","meaning":"这样的","note":"题 5","tag":["连体"]},
  {"id":"tr-w287","jp":"あらゆる","reading":"あらゆる","romaji":"arayuru","meaning":"所有/一切","note":"题 3","tag":["连体"]},
  {"id":"tr-w288","jp":"いかなる","reading":"いかなる","romaji":"ikanaru","meaning":"任何/怎样的","note":"题 3","tag":["连体"]},
  {"id":"tr-w289","jp":"原則として","reading":"げんそくとして","romaji":"gensoku to shite","meaning":"原则上","note":"题 3","tag":["副词"]},
  {"id":"tr-w290","jp":"限り","reading":"かぎり","romaji":"kagiri","meaning":"只要/限于","note":"题 3","tag":["句型"]},

  // ============ 常见场景词 ============
  {"id":"tr-w291","jp":"優先","reading":"ゆうせん","romaji":"yuusen","meaning":"优先","note":"题 5","tag":["术语"]},
  {"id":"tr-w292","jp":"譲り合い","reading":"ゆずりあい","romaji":"yuzuri-ai","meaning":"互让","note":"题 4","tag":["术语"]},
  {"id":"tr-w293","jp":"合図","reading":"あいず","romaji":"aizu","meaning":"信号/打灯","note":"题 4","tag":["动作"]},
  {"id":"tr-w294","jp":"点灯","reading":"てんとう","romaji":"tentou","meaning":"点灯","note":"题 3","tag":["动作"]},
  {"id":"tr-w295","jp":"消える","reading":"きえる","romaji":"kieru","meaning":"熄灭","note":"题 3","tag":["动词"]},
  {"id":"tr-w296","jp":"点滅","reading":"てんめつ","romaji":"tenmetsu","meaning":"闪烁","note":"题 3","tag":["术语"]},
  {"id":"tr-w297","jp":"鳴る","reading":"なる","romaji":"naru","meaning":"响","note":"题 3","tag":["动词"]},
  {"id":"tr-w298","jp":"標示","reading":"ひょうじ","romaji":"hyouji","meaning":"路面标线","note":"题 4","tag":["标志"]},
  {"id":"tr-w299","jp":"片側","reading":"かたがわ","romaji":"kata-gawa","meaning":"单侧","note":"题 4","tag":["术语"]},
  {"id":"tr-w300","jp":"両側","reading":"りょうがわ","romaji":"ryou-gawa","meaning":"两侧","note":"题 3","tag":["术语"]},
  {"id":"tr-w301","jp":"対向車","reading":"たいこうしゃ","romaji":"taikousha","meaning":"对向车","note":"题 3","tag":["车辆"]},
  {"id":"tr-w302","jp":"先行車","reading":"せんこうしゃ","romaji":"senkousha","meaning":"前车","note":"题 3","tag":["车辆"]},
  {"id":"tr-w303","jp":"後続車","reading":"こうぞくしゃ","romaji":"kouzokusha","meaning":"后车","note":"题 3","tag":["车辆"]},
  {"id":"tr-w304","jp":"左側","reading":"ひだりがわ","romaji":"hidari-gawa","meaning":"左侧","note":"题 3","tag":["术语"]},
  {"id":"tr-w305","jp":"両側","reading":"りょうがわ","romaji":"ryou-gawa","meaning":"两侧","note":"题 3","tag":["术语"]},
];

const existingById = new Map(existing.map((w) => [w.id, w]));

let added = 0;
let skipped = 0;
for (const w of additions) {
  if (existingById.has(w.id)) {
    skipped++;
    continue;
  }
  if (existingSet.has(w.jp)) {
    skipped++;
    continue;
  }
  existing.push(w);
  existingSet.add(w.jp);
  existingById.set(w.id, w);
  added++;
}

fs.writeFileSync(wordsPath, JSON.stringify(existing, null, 2) + '\n');
console.log(`Added: ${added} | Skipped: ${skipped} | Total: ${existing.length}`);
