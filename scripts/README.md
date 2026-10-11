# TTS 静态资源生成器

把场景里的所有日文 + 英文文本用 Google Cloud Text-to-Speech (chirp3 HD) 生成 MP3，作为 Vite 静态资源放到 `public/audio/`。前端优先用 mp3 播放，缺失时 fallback 到浏览器原生 Web Speech API。

## 一次性配置

```bash
# 1. 把示例配置复制成实际配置
cp scripts/.tts-config.example.json scripts/.tts-config.json

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

# 强制重新生成所有 mp3（voice 改了或想全量重生成时用）
npm run tts:force

# 只看会扫到多少文本，不调用 API（不需要凭证）
npm run tts:dry
```

## 扫描覆盖范围

| 数据源 | 字段 | 说明 |
|---|---|---|
| **words.json** | `jp` | 所有单词（汉字/片假名/平假名） |
| **words.json** | `en` | 单词英文翻译（如果有） |
| **grammar.json** | `examples[].jp` | 语法例句 |
| **dialogs.json** | `lines[].jp` | 对话每行 |
| **listening.json** | `audio` | 听力题日文题干 |
| **quiz.json** | `audio` | 听力题（type=listening/response/spell-audio）的题干 |
| **quiz.json** | `prompt` | 拼写题（type=spelling）的词 |

### 预估（8 场景，dry-run 统计）

| 数据源 | 文本数 |
|---|---|
| jp words | ~1234 |
| en words | ~355 |
| grammar examples | ~270 |
| dialog lines | ~581 |
| listening | ~130 |
| quiz (听力/拼写) | ~3926 |
| **总计（去重前）** | **~6496** |

去重后通常减少 10-20%（同词在不同场景重复出现）。

## 设计要点

- **文件名稳定性**：`sha1(normalize(text)).slice(0, 12)` 作为文件名
  - 文本变了 hash 自动变 → 自动生成新文件
  - 旧文件留着不动（可手动清理 `public/audio/`）
- **可多次运行**：存在的 mp3 自动跳过，只补缺失的
- **去重**：同文本（如多个场景都出现「ハンドル」）只生成 1 份 mp3
- **chirp3 HD voices**：默认 `ja-JP-Chirp3-HD-Charon` + `en-US-Chirp3-HD-Charon`，可在脚本里改 `VOICES` 常量
- **限速**：每 200ms 一次，避免触发 API 配额限制
- **失败保护**：连续 5 次失败自动中止（可能是凭证或配额问题）

## 前端集成

`src/lib/speech.ts` 自动按以下优先级：

1. **MP3 静态资源**（`/audio/{ja,en}/<hash>.mp3`）—— 高质量 Google chirp3 HD
2. **Web Speech API** fallback —— 浏览器原生 ja-JP/en-US TTS

调用方无需改动（`speak(text, { lang: 'en-US' })` 自动走英文路径）。

## 成本

chirp3 HD 约 $16/1M 字符（按 Google Cloud 公开价格）。本项目估算单次生成成本 < $1。

## 故障排查

- `找不到配置文件` → 没复制 `.tts-config.example.json` 到 `.tts-config.json`
- `permission denied` → service account 没有 Text-to-Speech API 权限
- `INVALID_ARGUMENT` → voice name 不对，去 [Google TTS voices](https://cloud.google.com/text-to-speech/docs/voices) 查可用 chirp3 voice
