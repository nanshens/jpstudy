// 把 quiz-extras.json 合并到 quiz.json(去重 id)
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '..', 'public', 'data', 'scenarios', 'traffic-rules');
const main = JSON.parse(fs.readFileSync(path.join(DIR, 'quiz.json'), 'utf8'));
const extras = JSON.parse(fs.readFileSync(path.join(DIR, 'quiz-extras.json'), 'utf8'));

const ids = new Set(main.map((q) => q.id));
const merged = main.slice();
let added = 0;
for (const q of extras) {
  if (ids.has(q.id)) continue;
  merged.push(q);
  ids.add(q.id);
  added++;
}
fs.writeFileSync(path.join(DIR, 'quiz.json'), JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log(`已合并: 新增 ${added} 题,共 ${merged.length} 题`);

// 顺手把 quiz-extras.json 删掉(已经合并)
// 保留留档也可以,先留着方便回滚
