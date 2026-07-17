// 给现有 quiz.json 批量加 type 字段
// - 5 个常规场景 → 'choice'
// - traffic-rules → 'truefalse'
// 幂等:已有 type 字段的不动
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public', 'data', 'scenarios');

const CHOICE_SCENARIOS = ['driving', 'enrollment', 'course-practice', 'road-test', 'signs-rules'];
const TRUEFALSE_SCENARIOS = ['traffic-rules'];

function patch(scenarios, type) {
  for (const id of scenarios) {
    const p = path.join(ROOT, id, 'quiz.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    let modified = 0;
    for (const q of data) {
      if (!q.type) {
        q.type = type;
        modified++;
      }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`[${id}] ${type}: ${modified} 题加 type 字段 (共 ${data.length} 题)`);
  }
}

patch(CHOICE_SCENARIOS, 'choice');
patch(TRUEFALSE_SCENARIOS, 'truefalse');
console.log('Done');
