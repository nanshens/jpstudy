// 从 quiz.json 提取的补全句型,追加到 traffic-rules/grammar.json
const fs = require('fs');
const path = require('path');

const grammarPath = path.join(__dirname, '..', 'public', 'data', 'scenarios', 'traffic-rules', 'grammar.json');
const existing = JSON.parse(fs.readFileSync(grammarPath, 'utf-8'));
const existingById = new Map(existing.map((g) => [g.id, g]));
const existingPattern = new Set(existing.map((g) => g.pattern));

const additions = [
  {"id":"tr-g26","title":"〜てから","pattern":"V-てから","meaning":"…之后","explanation":"表示做完前项之后再做后项。在题里常出现,如「停車してから…」","examples":[{"jp":"停車してから、徐行する。","reading":"ていしゃしてから、じょこうする。","meaning":"停车之后,慢行。"}],"note":"","tag":["句型"]},
  {"id":"tr-g27","title":"〜なくて","pattern":"V-なくて","meaning":"不…","explanation":"否定中顿,表不做前项就…","examples":[{"jp":"確認しないで、合図をしてはいけない。","reading":"かくにんしないで、あいずをしてはいけない。","meaning":"不确认就不可打信号。"}],"note":"","tag":["句型"]},
  {"id":"tr-g28","title":"〜ば","pattern":"V-ば","meaning":"如果…(假定条件)","explanation":"表假定条件。比〜たら更书面。","examples":[{"jp":"危険があれば、停車する。","reading":"きけんがあれば、ていしゃする。","meaning":"如果有危险就停车。"}],"note":"","tag":["句型"]},
  {"id":"tr-g29","title":"〜ない限り","pattern":"V-ない限り","meaning":"只要不…","explanation":"表条件/范围。题里高频,如「赤信号でない限り進めない」","examples":[{"jp":"青信号でない限り、進めない。","reading":"あおしんごうでないかぎり、すすめない。","meaning":"只要不是绿灯,就不能前进。"}],"note":"","tag":["句型"]},
  {"id":"tr-g30","title":"〜に従って","pattern":"N-にしたがって","meaning":"根据…/按照…","explanation":"表依据/伴随变化。题里常出现。","examples":[{"jp":"標識に従って通行する。","reading":"ひょうしきにしたがってつうこうする。","meaning":"按标志通行。"}],"note":"","tag":["句型"]},
  {"id":"tr-g31","title":"〜に比べて","pattern":"N-にくらべて","meaning":"和…相比","explanation":"表比较。","examples":[{"jp":"昨年に比べて、事故が減った。","reading":"さくねんにくらべて、じこがへった。","meaning":"和去年相比,事故减少了。"}],"note":"","tag":["句型"]},
  {"id":"tr-g32","title":"〜として","pattern":"N-として","meaning":"作为…","explanation":"表身份/立场/资格。","examples":[{"jp":"歩行者として注意する。","reading":"ほこうしゃとしてちゅういする。","meaning":"作为行人去注意。"}],"note":"","tag":["句型"]},
  {"id":"tr-g33","title":"〜について","pattern":"N-について","meaning":"关于…","explanation":"表话题/对象。","examples":[{"jp":"交通ルールについて学ぶ。","reading":"こうつうルールについてまなぶ。","meaning":"学习关于交通规则。"}],"note":"","tag":["句型"]},
  {"id":"tr-g34","title":"〜によると","pattern":"N-によると","meaning":"根据…(信息源)","explanation":"表信息来源。","examples":[{"jp":"天気予報によると、明日雨が降る。","reading":"てんきよほうによると、あしたあめがふる。","meaning":"据天气预报,明天下雨。"}],"note":"","tag":["句型"]},
  {"id":"tr-g35","title":"〜ようにする","pattern":"V-ようにする","meaning":"做到…/使之…","explanation":"表示努力使某事发生。题里常见。","examples":[{"jp":"徐行するようにする。","reading":"じょこうするようにする。","meaning":"做到慢行。"},{"jp":"安全距離を保つようにする。","reading":"あんぜんきょりをたもつようにする。","meaning":"保持安全距离。"}],"note":"","tag":["句型"]},
  {"id":"tr-g36","title":"〜ようになる","pattern":"V-ようになる","meaning":"变得会…","explanation":"表示状态变化。题里出现。","examples":[{"jp":"標識に従って通行するようになる。","reading":"ひょうしきにしたがってつうこうするようになる。","meaning":"会按标志通行。"}],"note":"","tag":["句型"]},
  {"id":"tr-g37","title":"〜前に","pattern":"V-る/V-た まえに","meaning":"…之前","explanation":"时间先后。题里如「発進する前に確認」","examples":[{"jp":"発進する前に、安全確認する。","reading":"はっしんするまえに、あんぜんかくにんする。","meaning":"起步前,安全确认。"}],"note":"","tag":["句型"]},
  {"id":"tr-g38","title":"〜後に","pattern":"V-た あとに","meaning":"…之后","explanation":"时间先后。","examples":[{"jp":"停車したあと、エンジンを切る。","reading":"ていしゃしたあと、エンジンをきる。","meaning":"停车后,关引擎。"}],"note":"","tag":["句型"]},
  {"id":"tr-g39","title":"〜間","pattern":"N-あいだ","meaning":"…期间","explanation":"表期间。题里如「停車している間は…」","examples":[{"jp":"停車している間は、サイドブレーキを引く。","reading":"ていしゃしているあいだは、サイドブレーキをひく。","meaning":"停车期间,拉手刹。"}],"note":"","tag":["句型"]},
  {"id":"tr-g40","title":"〜間に","pattern":"V-ている あいだに","meaning":"在…期间(做另一件事)","explanation":"在某动作持续期间做另一件事。","examples":[{"jp":"運転している間に、ナビを見てはいけない。","reading":"うんてんしているあいだに、ナビをみてはいけない。","meaning":"驾驶期间不可以看导航。"}],"note":"","tag":["句型"]},
  {"id":"tr-g41","title":"〜ようにする vs 〜ようになる","pattern":"〜ようにする / 〜ようになる","meaning":"主观努力 vs 自然变化","explanation":"前者表主观努力使之发生,后者表自然而然变化。题里易混。","examples":[{"jp":"安全確認を必ずする**ようにする**。(主观努力)","reading":"あんぜんかくにんをかならずする**ようにする**。","meaning":"做到必定安全确认。"},{"jp":"標識の意味が**わかるようになる**。(自然理解)","reading":"ひょうしきのいみが**わかるようになる**。","meaning":"能理解标志的意思了。"}],"note":"笔试易混","tag":["对比"]},
  {"id":"tr-g42","title":"〜ば〜ほど","pattern":"〜ば〜ほど","meaning":"越…越…","explanation":"程度递增。","examples":[{"jp":"速度が出れば出るほど、危険が増す。","reading":"そくどがでればでるほど、きけんがます。","meaning":"速度越快越危险。"}],"note":"","tag":["句型"]},
  {"id":"tr-g43","title":"〜て済む","pattern":"V-てすむ","meaning":"…就行/…了事","explanation":"凑合/足够。","examples":[{"jp":"罰金で済む。","reading":"ばっきんですむ。","meaning":"交罚金就完事。"}],"note":"","tag":["句型"]},
  {"id":"tr-g44","title":"〜かもしれない","pattern":"V/I かもしれない","meaning":"也许/可能","explanation":"表推测。题里偶尔出现。","examples":[{"jp":"雨が降るかもしれない。","reading":"あめがふるかもしれない。","meaning":"也许会下雨。"}],"note":"","tag":["句型"]},
  {"id":"tr-g45","title":"〜べき","pattern":"V-るべき","meaning":"应该…","explanation":"表义务/建议。比〜なければならない弱。","examples":[{"jp":"標識は守るべきだ。","reading":"ひょうしきはまもるべきだ。","meaning":"应该遵守标志。"}],"note":"","tag":["句型"]},
];

let added = 0;
let skipped = 0;
for (const g of additions) {
  if (existingById.has(g.id) || existingPattern.has(g.pattern)) {
    skipped++;
    continue;
  }
  existing.push(g);
  existingById.set(g.id, g);
  existingPattern.add(g.pattern);
  added++;
}

fs.writeFileSync(grammarPath, JSON.stringify(existing, null, 2) + '\n');
console.log(`Grammar Added: ${added} | Skipped: ${skipped} | Total: ${existing.length}`);
