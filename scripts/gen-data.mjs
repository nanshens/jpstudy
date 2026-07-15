// 把所有老的 driving/*.ts 数据一次性转成 JSON
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = ['grammar', 'dialogs', 'listening', 'quiz'];

for (const name of files) {
  const src = readFileSync(`src/data/driving/${name}.ts`, 'utf-8');
  const m = src.match(new RegExp(`export const DRIVING_${name.toUpperCase()}[^=]*=\\s*(\\[[\\s\\S]*?\\n\\]);`));
  if (!m) {
    console.error(`未找到 DRIVING_${name.toUpperCase()}`);
    continue;
  }
  const fn = new Function('return ' + m[1] + ';');
  const arr = fn();
  writeFileSync(`public/data/scenarios/driving/${name}.json`, JSON.stringify(arr, null, 2), 'utf-8');
  console.log(`✓ ${name}.json: ${arr.length} 条`);
}
