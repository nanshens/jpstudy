// 一次性脚本: 把旧的 driving/words.ts 内容转成 words.json
// 跑完即可删除此脚本
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = readFileSync('src/data/driving/words.ts', 'utf-8');
// 用 eval 提取数组(简单粗暴,只为一次性迁移)
const m = src.match(/export const DRIVING_WORDS[^=]*=\s*(\[[\s\S]*?\n\]);/);
if (!m) {
  console.error('未找到 DRIVING_WORDS 数组');
  process.exit(1);
}
// 用 Function 求值
const fn = new Function('return ' + m[1] + ';');
const arr = fn();
writeFileSync('public/data/scenarios/driving/words.json', JSON.stringify(arr, null, 2), 'utf-8');
console.log('写入 ' + arr.length + ' 个单词');
