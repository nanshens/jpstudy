# TTS 静态资源生成器

把日语单词 + 英文翻译用 Google Cloud Text-to-Speech (chirp3 HD) 生成 MP3，作为 Vite 静态资源放到 `public/audio/`。前端优先用 mp3 播放，缺失时 fallback 到浏览器原生 Web Speech API。

## 一次性配置（项目内）

```bash
# 1. 把示例配置复制成实际配置
cp scripts/.tts-config.json scripts/.tts-config.json

# 2. 编辑 scripts/.tts-config.json，填入 Google Cloud service account 凭证：
#    - projectId:  GCP 项目 ID
#    - client_email: service account 邮箱
#    - private_key:  -----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
#    （service account 需要有 "Cloud Text-to-Speech API User" 角色）
```

`.tts-config.json` 已在 `.gitignore` 中，不会被 commit。

## 日常使用

```bash
# 生成所有缺失的 mp3（已经存在的会自动跳过）
npm run tts

# 强制重新生成全部 mp3（text 改了 hash 变的话建议加 --force）
npm run tts:force
```

输出示例：
```
🎙  Google Cloud TTS (chirp3 HD) 静态资源生成器

✅ 配置加载完成 (project: my-jpstudy)
📋 共 358 文本 (ja: 226, en: 132)

[1/358] ✓ ja/a1b2c3d4e5f6.mp3  (4.2KB)  "ハンドル"  [driving/w-handle]
[2/358] ✓ en/7e8f9a0b1c2d.mp3  (3.8KB)  "handle"  [driving/w-handle]
...
────── 完成 ──────
  ja: 226 文本 · 已存在 0 · 新生成 226 · 失败 0
  en: 132 文本 · 新生成 132 · 失败 0
```

## 设计要点

- **文件名稳定性**：`sha1(normalize(text)).slice(0, 12)` 作为文件名
  - 文本变了 hash 自动变 → 自动生成新文件
  - 旧文件留着不动（可手动清理 `public/audio/`）
- **可多次运行**：存在的 mp3 自动跳过，只补缺失的
- **按需扫描**：从 `public/data/scenarios/*/words.json` + `traffic-rules/words.json` 读取所有 `jp` 和 `en` 字段
- **去重**：同文本（如多个场景都出现「ハンドル」）只生成 1 份 mp3
- **chirp3 HD voices**：默认 `ja-JP-Chirp3-HD-Charon` + `en-US-Chirp3-HD-Charon`，可在脚本里改 `VOICES` 常量

## 前端集成

`src/lib/speech.ts` 自动按以下优先级：

1. **MP3 静态资源**（`/audio/{ja,en}/<hash>.mp3`）—— 高质量 Google chirp3 HD
2. **Web Speech API** fallback —— 浏览器原生 ja-JP/en-US TTS

调用方无需改动（`speak(text, { lang: 'en-US' })` 自动走英文路径）。

## 成本

chirp3 HD 大约 $16/1M 字符（按 Google Cloud 公开价格）。本项目 8 场景 × ~500 词 × 2 语言 ≈ 1000 个短音频，单次生成成本 < $0.5。

## 故障排查

- `找不到配置文件` → 没复制 `.tts-config.example.json` 到 `.tts-config.json`
- `permission denied` → service account 没有 Text-to-Speech API 权限
- `INVALID_ARGUMENT` → voice name 不对，去 [Google TTS voices](https://cloud.google.com/text-to-speech/docs/voices) 查可用 chirp3 voice
