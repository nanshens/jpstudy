# JP Study - 场景化日语学习

为在日本生活的你打造的 Web App。基于场景学习,内容覆盖 **单词 · 语法 · 对话 · 听力 · 小测**,配合浏览器 TTS 实时发音。

## 当前场景

🚗 **日本の運転免許** (学车) - 第一个场景,资源已经准备就绪:

- **120** 个单词 (人物 / 车辆部件 / 驾驶操作 / 道路 / 标识 / 手续 / 基础)
- **15** 条核心语法 (〜てください / 〜ましょう / 敬语 / 〜時 / 〜たい...)
- **8** 段真实对话 (入校手续 / 起步 / 坡道 / 路上 / 侧方停车 / 仮免考试 / 卒業検定)
- **20** 道听力题 (教官短句 / 数字时间 / 长句理解)
- **20** 道小测题

## 技术栈

- Vite + React 19 + TypeScript
- Tailwind CSS (shadcn 风格语义化 token)
- React Router v7
- Lucide React (图标)
- Web Speech API (TTS 浏览器原生,无外部资源)

## 运行

```bash
npm install
npm run dev   # 开发模式 (默认 http://localhost:5173)
npm run build # 生产构建
npm run preview # 预览构建产物
```

## 目录结构

```
src/
├── components/
│   ├── ui/        # 基础组件 (Button, Card, Tabs, Badge...)
│   ├── layout/    # AppShell
│   └── feature/   # 业务组件 (WordCard, DialogReader, ListeningPlayer...)
├── pages/
│   ├── Home.tsx
│   ├── KanaPage.tsx
│   ├── ScenarioPage.tsx
│   └── scenario/  # 场景子页 (Overview, Words, Grammar, Dialogs, Listening, Quiz)
├── data/
│   ├── kana.ts            # 五十音图完整数据
│   ├── scenarios.ts       # 场景注册表
│   └── driving/           # 第一个场景
│       ├── meta.ts
│       ├── words.ts
│       ├── grammar.ts
│       ├── dialogs.ts
│       ├── listening.ts
│       └── quiz.ts
├── lib/
│   ├── speech.ts          # Web Speech API 封装
│   ├── storage.ts         # localStorage + 学习进度
│   └── cn.ts              # className 合并
└── types/                 # 全局类型
```

## 添加新场景

1. 在 `src/data/` 下新建一个文件夹(比如 `hospital/`)
2. 按 `driving/` 的结构放 `meta.ts / words.ts / grammar.ts / dialogs.ts / listening.ts / quiz.ts`
3. 在 `src/data/scenarios.ts` 注册新场景

数据驱动,UI 不用动。

## 响应式

- Desktop 2560×1440: 侧边栏 + 宽内容
- Tablet 1280×800: 自适应
- Mobile (iPhone 13 Pro Max 390×844): 底部 Tab Bar + 紧凑布局
