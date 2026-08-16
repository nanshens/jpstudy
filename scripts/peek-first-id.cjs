const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', 'public', 'data', 'scenarios');
const SCENARIOS = ['enrollment','course-practice','road-test','signs-rules','medical','pregnancy','driving'];
for (const s of SCENARIOS) {
  try {
    const w = JSON.parse(fs.readFileSync(path.join(ROOT, s, 'words.json'), 'utf8'));
    const g = JSON.parse(fs.readFileSync(path.join(ROOT, s, 'grammar.json'), 'utf8'));
    console.log(`[${s}] word: ${w[0]?.id} (n=${w.length}) | grammar: ${g[0]?.id} (n=${g.length})`);
  } catch (e) {
    console.log(`[${s}] err: ${e.message}`);
  }
}
