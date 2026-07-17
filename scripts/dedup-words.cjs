// 清理 words.json 中的重复 jp
// 规则:同 jp 的多个条目,保留先出现的(原始词优先)
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'public', 'data', 'scenarios', 'traffic-rules', 'words.json');
const w = JSON.parse(fs.readFileSync(p, 'utf-8'));
const seen = new Set();
const unique = [];
const removed = [];
for (const x of w) {
  if (seen.has(x.jp)) {
    removed.push(x);
    continue;
  }
  seen.add(x.jp);
  unique.push(x);
}
fs.writeFileSync(p, JSON.stringify(unique, null, 2) + '\n');
console.log('Removed', removed.length, 'duplicates. New total:', unique.length);
removed.forEach((x) => console.log('  -', x.id, x.jp));
