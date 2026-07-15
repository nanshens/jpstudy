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

- Vite 8 + React 19 + TypeScript
- Tailwind CSS (shadcn 风格语义化 token)
- React Router v7
- Lucide React (图标)
- Web Speech API (TTS 浏览器原生,无外部音频资源)
- localStorage (学习进度持久化)

## 运行

```bash
npm install
npm run dev      # 开发模式 (默认 http://localhost:5173)
npm run build    # 生产构建
npm run preview  # 预览构建产物 (默认 http://localhost:4173)
```

## 目录结构

```
src/
├── components/
│   ├── ui/        # 基础组件 (Button, Card, Tabs, Badge, Progress, Input)
│   ├── layout/    # AppShell (顶部导航 + 移动端底部 Tab Bar)
│   └── feature/   # 业务组件 (WordCard, DialogReader, ListeningPlayer, KanaCell, SpeakButton, Loader)
├── pages/
│   ├── Home.tsx
│   ├── KanaPage.tsx
│   ├── ScenariosPage.tsx
│   ├── ScenarioPage.tsx
│   └── scenario/  # 场景子页 (Overview, Words, Grammar, Dialogs, Listening, Quiz)
├── lib/
│   ├── loader.ts   # JSON 资源加载器 (fetch 方式,运行时)
│   ├── speech.ts   # Web Speech API 封装 (优先 ja-JP)
│   ├── storage.ts  # localStorage + 学习进度
│   └── cn.ts       # className 合并
└── types/          # 全局类型

public/data/        # 所有学习内容 (静态资源,代码不需改即可加新场景)
├── kana.json
├── scenarios-index.json              # 场景列表 (id + meta)
└── scenarios/
    └── driving/                      # 学车场景
        ├── meta.json
        ├── words.json                # 120 条
        ├── grammar.json              # 15 条
        ├── dialogs.json              # 8 段
        ├── listening.json            # 20 道
        └── quiz.json                 # 20 道
```

## 添加新场景

**完全不需要改动代码**。只需要在 `public/data/` 下加文件:

1. 在 `public/data/scenarios-index.json` 数组里追加一条场景 meta (id, title, subtitle, emoji, color, description, goals)
2. 新建 `public/data/scenarios/<id>/` 目录,放数据文件:
   - `words.json` - `WordEntry[]`
   - `grammar.json` - `GrammarEntry[]`
   - `dialogs.json` - `Dialog[]`
   - `listening.json` - `ListeningItem[]`
   - `quiz.json` - `QuizQuestion[]`
3. 刷新页面即可看到新场景出现在「场景」页,点进去就能用

> 颜色字段使用 Tailwind gradient class,如 `"from-blue-500 via-indigo-500 to-purple-600"`。
> 所有 Tailwind 颜色 stop 已在 `tailwind.config.js` 的 `safelist` 里,新增颜色也能正常渲染。

## 响应式

- Desktop 2560×1440: 顶部导航 + 宽内容
- Tablet 1280×800: 自适应
- Mobile (iPhone 13 Pro Max 430×932): 底部 Tab Bar + 紧凑布局

## 数据结构

类型定义在 `src/types/index.ts`。所有 JSON 加载都通过 `src/lib/loader.ts`:

```ts
loadKana(): Promise<KanaData>                                    // /data/kana.json
loadScenarioMetas(): Promise<ScenarioMeta[]>                      // /data/scenarios-index.json
loadScenario(id: string): Promise<ScenarioData | null>            // /data/scenarios/<id>/{meta,words,...}.json
```

加载是异步的,所有 page 都有 loading / error 状态。
