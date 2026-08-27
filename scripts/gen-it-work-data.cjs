// 一次性生成 it-work 场景的 5 个 JSON 数据文件
// 数据量: 200 词 / 30 语法 / 8 对话 / 15 听力
// 输出: public/data/scenarios/it-work/{meta,words,grammar,dialogs,listening}.json
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve('D:/project/ai/jpstudy/public/data/scenarios/it-work');
fs.mkdirSync(OUT_DIR, { recursive: true });

function writeJson(name, data) {
  const fp = path.join(OUT_DIR, name);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
  const size = fs.statSync(fp).size;
  console.log(`  ✓ ${name}  (${(size / 1024).toFixed(1)} KB)`);
}

// ============ meta.json ============
const meta = {
  id: 'it-work',
  title: 'IT エンジニア・日本のIT会社',
  subtitle: '技术 / 流程 / 沟通 / 敬语',
  emoji: '💻',
  color: 'from-indigo-500 via-violet-500 to-purple-600',
  category: 'other',
  description: '在日本 IT 公司工作的全套日语:从技术词(API/デプロイ/バックエンド)、工作流程(アジャイル/スプリント/コードレビュー)、到工具名(Git/Slack/Jira)、再到高频敬语(承知しました/お疲れ様です/いただけますでしょうか)。让你进会场不哑巴、写 Slack 不卡壳、跟客户开会听得懂。',
  goals: [
    '掌握 200+ 技术词(语言/框架/工具/概念)',
    '听懂会议常用语(お疲れ様です/本日のアジェンダ/進捗お願いします)',
    '能读写 Pull Request 描述 + Review 评论',
    '会用敬语跟客户/上司沟通(いただけますでしょうか/のご了承をお願いいたします)',
    '能跟队友用 Slack/Teams 异步沟通(対応します/確認します/共有します)',
    '理解敏捷开发术语(スプリント/バックログ/レトロスペクティブ)',
    '能听懂障害通知 + Bug 修复流程(本番/ロールバック/再発防止)',
  ],
};

writeJson('meta.json', meta);

// ============ words.json ============
const words = [
  // ===== 主题 1: 职位 / 团队 (15) =====
  { id: 'w-role-01', word: 'エンジニア', reading: 'エンジニア', meaning: '工程师' },
  { id: 'w-role-02', word: 'プログラマー', reading: 'プログラマー', meaning: '程序员' },
  { id: 'w-role-03', word: 'マネージャー', reading: 'マネージャー', meaning: '经理 / 主管' },
  { id: 'w-role-04', word: 'プロジェクトマネージャー', reading: 'プロジェクトマネージャー', meaning: '项目经理 (PM)' },
  { id: 'w-role-05', word: 'システムエンジニア', reading: 'システムエンジニア', meaning: '系统工程师 (SE)' },
  { id: 'w-role-06', word: 'テックリード', reading: 'テックリード', meaning: '技术负责人' },
  { id: 'w-role-07', word: 'デザイナー', reading: 'デザイナー', meaning: '设计师' },
  { id: 'w-role-08', word: 'テスター', reading: 'テスター', meaning: '测试员' },
  { id: 'w-role-09', word: 'フロントエンドエンジニア', reading: 'フロントエンドエンジニア', meaning: '前端工程师' },
  { id: 'w-role-10', word: 'バックエンドエンジニア', reading: 'バックエンドエンジニア', meaning: '后端工程师' },
  { id: 'w-role-11', word: 'インフラエンジニア', reading: 'インフラエンジニア', meaning: '基础设施工程师' },
  { id: 'w-role-12', word: 'データサイエンティスト', reading: 'データサイエンティスト', meaning: '数据科学家' },
  { id: 'w-role-13', word: 'プロダクトオーナー', reading: 'プロダクトオーナー', meaning: '产品负责人 (PO)' },
  { id: 'w-role-14', word: 'スクラムマスター', reading: 'スクラムマスター', meaning: 'Scrum 主持' },
  { id: 'w-role-15', word: 'チームリーダー', reading: 'チームリーダー', meaning: '组长' },

  // ===== 主题 2: 会议 / 沟通 (15) =====
  { id: 'w-mtg-01', word: '打ち合わせ', reading: 'うちあわせ', meaning: '碰头会 / 会议' },
  { id: 'w-mtg-02', word: 'ミーティング', reading: 'ミーティング', meaning: '会议' },
  { id: 'w-mtg-03', word: '会議', reading: 'かいぎ', meaning: '会议' },
  { id: 'w-mtg-04', word: 'スタンドアップ', reading: 'スタンドアップ', meaning: '站会' },
  { id: 'w-mtg-05', word: '進捗報告', reading: 'しんちょくほうこく', meaning: '进度报告' },
  { id: 'w-mtg-06', word: 'レビュー', reading: 'レビュー', meaning: '审查 / 评审' },
  { id: 'w-mtg-07', word: 'ブレインストーミング', reading: 'ブレインストーミング', meaning: '头脑风暴' },
  { id: 'w-mtg-08', word: '振り返り', reading: 'ふりかえり', meaning: '回顾 (retro)' },
  { id: 'w-mtg-09', word: 'ワンオンワン', reading: 'ワンオンワン', meaning: '一对一会议 (1on1)' },
  { id: 'w-mtg-10', word: '朝会', reading: 'あさかい', meaning: '早会' },
  { id: 'w-mtg-11', word: '週次会議', reading: 'しゅうじかいぎ', meaning: '周会' },
  { id: 'w-mtg-12', word: '総会', reading: 'そうかい', meaning: '全员大会' },
  { id: 'w-mtg-13', word: '議事録', reading: 'ぎじろく', meaning: '会议记录' },
  { id: 'w-mtg-14', word: 'アジェンダ', reading: 'アジェンダ', meaning: '议程' },
  { id: 'w-mtg-15', word: '議題', reading: 'ぎだい', meaning: '议题' },

  // ===== 主题 3: 软件 / 工具 (30) =====
  { id: 'w-tool-01', word: 'Git', reading: 'ギット', meaning: '版本控制工具' },
  { id: 'w-tool-02', word: 'GitHub', reading: 'ギットハブ', meaning: '代码托管平台' },
  { id: 'w-tool-03', word: 'GitLab', reading: 'ギットラブ', meaning: '自建代码托管' },
  { id: 'w-tool-04', word: 'Slack', reading: 'スラック', meaning: '团队聊天工具' },
  { id: 'w-tool-05', word: 'Microsoft Teams', reading: 'マイクロソフト チームズ', meaning: '微软团队协作' },
  { id: 'w-tool-06', word: 'Jira', reading: 'ジラ', meaning: '任务管理工具' },
  { id: 'w-tool-07', word: 'Confluence', reading: 'コンフルエンス', meaning: '文档协作工具' },
  { id: 'w-tool-08', word: 'Notion', reading: 'ノーション', meaning: '笔记/文档工具' },
  { id: 'w-tool-09', word: 'Trello', reading: 'トレロ', meaning: '看板工具' },
  { id: 'w-tool-10', word: 'Asana', reading: 'アサナ', meaning: '任务管理' },
  { id: 'w-tool-11', word: 'Figma', reading: 'フィグマ', meaning: '设计协作工具' },
  { id: 'w-tool-12', word: 'VSCode', reading: 'ブイエスコード', meaning: '代码编辑器' },
  { id: 'w-tool-13', word: 'IntelliJ IDEA', reading: 'インテリジェイ アイディア', meaning: 'Java IDE' },
  { id: 'w-tool-14', word: 'PyCharm', reading: 'パイチャーム', meaning: 'Python IDE' },
  { id: 'w-tool-15', word: 'Docker', reading: 'ドッカー', meaning: '容器化平台' },
  { id: 'w-tool-16', word: 'Kubernetes', reading: 'クーバネティス', meaning: '容器编排 (k8s)' },
  { id: 'w-tool-17', word: 'Jenkins', reading: 'ジェンキンス', meaning: 'CI/CD 工具' },
  { id: 'w-tool-18', word: 'GitHub Actions', reading: 'ギットハブ アクションズ', meaning: 'CI/CD 服务' },
  { id: 'w-tool-19', word: 'Terraform', reading: 'テラフォーム', meaning: '基础设施即代码' },
  { id: 'w-tool-20', word: 'Ansible', reading: 'アンシブル', meaning: '自动化运维' },
  { id: 'w-tool-21', word: 'Zoom', reading: 'ズーム', meaning: '视频会议' },
  { id: 'w-tool-22', word: 'Google Meet', reading: 'グーグル ミート', meaning: '谷歌视频会议' },
  { id: 'w-tool-23', word: 'Webex', reading: 'ウェブエックス', meaning: '思科视频会议' },
  { id: 'w-tool-24', word: 'Postman', reading: 'ポストマン', meaning: 'API 测试工具' },
  { id: 'w-tool-25', word: 'Swagger', reading: 'スウォッガー', meaning: 'API 文档工具' },
  { id: 'w-tool-26', word: 'Sentry', reading: 'セントリー', meaning: '错误监控' },
  { id: 'w-tool-27', word: 'Datadog', reading: 'データドッグ', meaning: '应用监控' },
  { id: 'w-tool-28', word: 'Grafana', reading: 'グラファナ', meaning: '可视化监控' },
  { id: 'w-tool-29', word: 'Prometheus', reading: 'プロメテウス', meaning: '监控告警' },
  { id: 'w-tool-30', word: 'CircleCI', reading: 'サークルシーアイ', meaning: 'CI/CD 平台' },

  // ===== 主题 4: 编程语言 (16) =====
  { id: 'w-lang-01', word: 'JavaScript', reading: 'ジャバスクリプト', meaning: 'JS 编程语言' },
  { id: 'w-lang-02', word: 'TypeScript', reading: 'タイプスクリプト', meaning: 'TS 编程语言' },
  { id: 'w-lang-03', word: 'Python', reading: 'パイソン', meaning: 'Python 语言' },
  { id: 'w-lang-04', word: 'Java', reading: 'ジャバ', meaning: 'Java 语言' },
  { id: 'w-lang-05', word: 'Go', reading: 'ゴー', meaning: 'Go 语言' },
  { id: 'w-lang-06', word: 'Rust', reading: 'ラスト', meaning: 'Rust 语言' },
  { id: 'w-lang-07', word: 'Ruby', reading: 'ルビー', meaning: 'Ruby 语言' },
  { id: 'w-lang-08', word: 'PHP', reading: 'ピーエイチピー', meaning: 'PHP 语言' },
  { id: 'w-lang-09', word: 'C#', reading: 'シーシャープ', meaning: 'C# 语言' },
  { id: 'w-lang-10', word: 'C++', reading: 'シープラスプラス', meaning: 'C++ 语言' },
  { id: 'w-lang-11', word: 'Kotlin', reading: 'コトリン', meaning: 'Kotlin 语言' },
  { id: 'w-lang-12', word: 'Swift', reading: 'スウィフト', meaning: 'Swift 语言' },
  { id: 'w-lang-13', word: 'Scala', reading: 'スカラ', meaning: 'Scala 语言' },
  { id: 'w-lang-14', word: 'SQL', reading: 'エスキューエル', meaning: '结构化查询语言' },
  { id: 'w-lang-15', word: 'HTML', reading: 'エイチティーエムエル', meaning: '超文本标记语言' },
  { id: 'w-lang-16', word: 'CSS', reading: 'シーエスエス', meaning: '层叠样式表' },

  // ===== 主题 5: 技术概念 (30) =====
  { id: 'w-tech-01', word: 'データベース', reading: 'データベース', meaning: '数据库 (DB)' },
  { id: 'w-tech-02', word: 'サーバー', reading: 'サーバー', meaning: '服务器' },
  { id: 'w-tech-03', word: 'フロントエンド', reading: 'フロントエンド', meaning: '前端' },
  { id: 'w-tech-04', word: 'バックエンド', reading: 'バックエンド', meaning: '后端' },
  { id: 'w-tech-05', word: 'API', reading: 'エーアイピー', meaning: '应用程序接口' },
  { id: 'w-tech-06', word: 'エンドポイント', reading: 'エンドポイント', meaning: 'API 端点' },
  { id: 'w-tech-07', word: 'クラウド', reading: 'クラウド', meaning: '云' },
  { id: 'w-tech-08', word: 'セキュリティ', reading: 'セキュリティ', meaning: '安全 / 安全性' },
  { id: 'w-tech-09', word: 'デプロイ', reading: 'デプロイ', meaning: '部署' },
  { id: 'w-tech-10', word: 'テスト', reading: 'テスト', meaning: '测试' },
  { id: 'w-tech-11', word: 'シーアイシーディー', reading: 'シーアイシーディー', meaning: '持续集成/部署 (CI/CD)' },
  { id: 'w-tech-12', word: 'バージョン管理', reading: 'バージョンかんり', meaning: '版本管理' },
  { id: 'w-tech-13', word: 'フレームワーク', reading: 'フレームワーク', meaning: '框架' },
  { id: 'w-tech-14', word: 'ライブラリ', reading: 'ライブラリ', meaning: '库' },
  { id: 'w-tech-15', word: 'ソースコード', reading: 'ソースコード', meaning: '源代码' },
  { id: 'w-tech-16', word: 'リポジトリ', reading: 'リポジトリ', meaning: '代码仓库' },
  { id: 'w-tech-17', word: 'コミット', reading: 'コミット', meaning: '提交代码' },
  { id: 'w-tech-18', word: 'プッシュ', reading: 'プッシュ', meaning: '推送' },
  { id: 'w-tech-19', word: 'プルリクエスト', reading: 'プルリクエスト', meaning: '合并请求 (PR)' },
  { id: 'w-tech-20', word: 'マージ', reading: 'マージ', meaning: '合并' },
  { id: 'w-tech-21', word: 'ブランチ', reading: 'ブランチ', meaning: '分支' },
  { id: 'w-tech-22', word: 'コンフリクト', reading: 'コンフリクト', meaning: '代码冲突' },
  { id: 'w-tech-23', word: 'デバッグ', reading: 'デバッグ', meaning: '调试' },
  { id: 'w-tech-24', word: 'リファクタリング', reading: 'リファクタリング', meaning: '重构' },
  { id: 'w-tech-25', word: 'コードレビュー', reading: 'コードレビュー', meaning: '代码审查' },
  { id: 'w-tech-26', word: '仕様書', reading: 'しようしょ', meaning: '规约书 / 规格书' },
  { id: 'w-tech-27', word: '設計書', reading: 'せっけいしょ', meaning: '设计书' },
  { id: 'w-tech-28', word: 'ドキュメント', reading: 'ドキュメント', meaning: '文档' },
  { id: 'w-tech-29', word: '単体テスト', reading: 'たんたいテスト', meaning: '单元测试' },
  { id: 'w-tech-30', word: '結合テスト', reading: 'けつごうテスト', meaning: '集成测试' },

  // ===== 主题 6: 设备 / 网络 (15) =====
  { id: 'w-dev-01', word: 'パソコン', reading: 'パソコン', meaning: '电脑' },
  { id: 'w-dev-02', word: 'ノートパソコン', reading: 'ノートパソコン', meaning: '笔记本电脑' },
  { id: 'w-dev-03', word: 'モニター', reading: 'モニター', meaning: '显示器' },
  { id: 'w-dev-04', word: 'キーボード', reading: 'キーボード', meaning: '键盘' },
  { id: 'w-dev-05', word: 'マウス', reading: 'マウス', meaning: '鼠标' },
  { id: 'w-dev-06', word: 'トラックパッド', reading: 'トラックパッド', meaning: '触控板' },
  { id: 'w-dev-07', word: 'ヘッドセット', reading: 'ヘッドセット', meaning: '耳机 (耳麦)' },
  { id: 'w-dev-08', word: 'マイク', reading: 'マイク', meaning: '麦克风' },
  { id: 'w-dev-09', word: 'ウェブカメラ', reading: 'ウェブカメラ', meaning: '网络摄像头' },
  { id: 'w-dev-10', word: 'ワイファイ', reading: 'ワイファイ', meaning: 'Wi-Fi 无线网' },
  { id: 'w-dev-11', word: 'ブイピーエヌ', reading: 'ブイピーエヌ', meaning: '虚拟专用网 (VPN)' },
  { id: 'w-dev-12', word: 'ファイアウォール', reading: 'ファイアウォール', meaning: '防火墙' },
  { id: 'w-dev-13', word: 'ルーター', reading: 'ルーター', meaning: '路由器' },
  { id: 'w-dev-14', word: 'プロキシ', reading: 'プロキシ', meaning: '代理服务器' },
  { id: 'w-dev-15', word: 'サーバー室', reading: 'サーバーしつ', meaning: '机房' },

  // ===== 主题 7: 环境 (15) =====
  { id: 'w-env-01', word: 'ローカル環境', reading: 'ローカルかんきょう', meaning: '本地环境' },
  { id: 'w-env-02', word: '開発環境', reading: 'かいはつかんきょう', meaning: '开发环境' },
  { id: 'w-env-03', word: 'テスト環境', reading: 'テストかんきょう', meaning: '测试环境' },
  { id: 'w-env-04', word: 'ステージング環境', reading: 'ステージングかんきょう', meaning: '准生产环境' },
  { id: 'w-env-05', word: '本番環境', reading: 'ほんばんかんきょう', meaning: '正式环境 (生产)' },
  { id: 'w-env-06', word: '検証環境', reading: 'けんしょうかんきょう', meaning: '验证环境' },
  { id: 'w-env-07', word: 'サンドボックス', reading: 'サンドボックス', meaning: '沙盒环境' },
  { id: 'w-env-08', word: 'コンテナ', reading: 'コンテナ', meaning: '容器' },
  { id: 'w-env-09', word: '仮想マシン', reading: 'かそうマシン', meaning: '虚拟机 (VM)' },
  { id: 'w-env-10', word: 'イメージ', reading: 'イメージ', meaning: '镜像' },
  { id: 'w-env-11', word: 'ネットワーク', reading: 'ネットワーク', meaning: '网络' },
  { id: 'w-env-12', word: 'ドメイン', reading: 'ドメイン', meaning: '域名' },
  { id: 'w-env-13', word: 'エスエスエル', reading: 'エスエスエル', meaning: 'SSL 加密协议' },
  { id: 'w-env-14', word: 'エスティーエヌ', reading: 'エスティーエヌ', meaning: '临时网络 (staging)' },
  { id: 'w-env-15', word: 'エンドポイント', reading: 'エンドポイント', meaning: '端点 / 终端' },

  // ===== 主题 8: 工作流程 (15) =====
  { id: 'w-wf-01', word: 'チケット', reading: 'チケット', meaning: '工单' },
  { id: 'w-wf-02', word: 'タスク', reading: 'タスク', meaning: '任务' },
  { id: 'w-wf-03', word: 'ユーザーストーリー', reading: 'ユーザーストーリー', meaning: '用户故事' },
  { id: 'w-wf-04', word: 'エピック', reading: 'エピック', meaning: '史诗 (Epic)' },
  { id: 'w-wf-05', word: 'スプリント', reading: 'スプリント', meaning: '迭代周期' },
  { id: 'w-wf-06', word: 'バックログ', reading: 'バックログ', meaning: '待办列表' },
  { id: 'w-wf-07', word: '工数', reading: 'こうすう', meaning: '工时' },
  { id: 'w-wf-08', word: '見積もり', reading: 'みつもり', meaning: '估算' },
  { id: 'w-wf-09', word: '進捗', reading: 'しんちょく', meaning: '进度' },
  { id: 'w-wf-10', word: '納期', reading: 'のうき', meaning: '交付期' },
  { id: 'w-wf-11', word: '締め切り', reading: 'しめきり', meaning: '截止日期' },
  { id: 'w-wf-12', word: 'イテレーション', reading: 'イテレーション', meaning: '迭代' },
  { id: 'w-wf-13', word: 'マイルストーン', reading: 'マイルストーン', meaning: '里程碑' },
  { id: 'w-wf-14', word: 'リリース', reading: 'リリース', meaning: '发布 / 上线' },
  { id: 'w-wf-15', word: 'レトロスペクティブ', reading: 'レトロスペクティブ', meaning: '回顾会议' },

  // ===== 主题 9: 问题 / 故障 (15) =====
  { id: 'w-bug-01', word: 'バグ', reading: 'バグ', meaning: '缺陷 / Bug' },
  { id: 'w-bug-02', word: 'エラー', reading: 'エラー', meaning: '错误' },
  { id: 'w-bug-03', word: '障害', reading: 'しょうがい', meaning: '故障' },
  { id: 'w-bug-04', word: 'インシデント', reading: 'インシデント', meaning: '事故' },
  { id: 'w-bug-05', word: 'トラブル', reading: 'トラブル', meaning: '麻烦 / 故障' },
  { id: 'w-bug-06', word: '修正', reading: 'しゅうせい', meaning: '修正' },
  { id: 'w-bug-07', word: '緊急', reading: 'きんきゅう', meaning: '紧急' },
  { id: 'w-bug-08', word: '至急', reading: 'しきゅう', meaning: '加急' },
  { id: 'w-bug-09', word: '復旧', reading: 'ふっきゅう', meaning: '恢复' },
  { id: 'w-bug-10', word: 'ロールバック', reading: 'ロールバック', meaning: '回滚' },
  { id: 'w-bug-11', word: '原因調査', reading: 'げんいんちょうさ', meaning: '原因调查' },
  { id: 'w-bug-12', word: '再発防止', reading: 'さいはつぼうし', meaning: '防止复发' },
  { id: 'w-bug-13', word: 'ホットフィックス', reading: 'ホットフィックス', meaning: '热修复' },
  { id: 'w-bug-14', word: 'ログ', reading: 'ログ', meaning: '日志' },
  { id: 'w-bug-15', word: 'スタックトレース', reading: 'スタックトレース', meaning: '堆栈跟踪' },

  // ===== 主题 10: 商务敬语 (25) =====
  { id: 'w-manner-01', word: 'お疲れ様です', reading: 'おつかれさまです', meaning: '辛苦了 (问候/道别)' },
  { id: 'w-manner-02', word: 'よろしくお願いいたします', reading: 'よろしくおねがいいたします', meaning: '请多关照' },
  { id: 'w-manner-03', word: '承知しました', reading: 'しょうちしました', meaning: '我知道了' },
  { id: 'w-manner-04', word: '確認しました', reading: 'かくにんしました', meaning: '我确认了' },
  { id: 'w-manner-05', word: '共有します', reading: 'きょうゆうします', meaning: '我分享一下' },
  { id: 'w-manner-06', word: '検討します', reading: 'けんとうします', meaning: '我考虑一下' },
  { id: 'w-manner-07', word: '対応します', reading: 'たいおうします', meaning: '我来处理' },
  { id: 'w-manner-08', word: '返信します', reading: 'へんしんします', meaning: '我会回复' },
  { id: 'w-manner-09', word: '報告します', reading: 'ほうこくします', meaning: '我汇报一下' },
  { id: 'w-manner-10', word: '連絡します', reading: 'れんらくします', meaning: '我会联系' },
  { id: 'w-manner-11', word: 'お時間よろしいでしょうか', reading: 'おじかんよろしいでしょうか', meaning: '您现在方便吗?' },
  { id: 'w-manner-12', word: '少々お待ちください', reading: 'しょうしょうおまちください', meaning: '请稍等' },
  { id: 'w-manner-13', word: '失礼します', reading: 'しつれいします', meaning: '告辞了 / 失礼' },
  { id: 'w-manner-14', word: 'お世話になっております', reading: 'おせわになっております', meaning: '承蒙关照' },
  { id: 'w-manner-15', word: '申し訳ございません', reading: 'もうしわけございません', meaning: '非常抱歉' },
  { id: 'w-manner-16', word: '助かります', reading: 'たすかります', meaning: '帮大忙' },
  { id: 'w-manner-17', word: '了解です', reading: 'りょうかいです', meaning: '了解' },
  { id: 'w-manner-18', word: '問題ありません', reading: 'もんだいありません', meaning: '没问题' },
  { id: 'w-manner-19', word: '可能です', reading: 'かのうです', meaning: '可以' },
  { id: 'w-manner-20', word: 'ご確認ください', reading: 'かくにんしてください', meaning: '请确认' },
  { id: 'w-manner-21', word: 'お疲れさまでした', reading: 'おつかれさまでした', meaning: '辛苦了 (下班时)' },
  { id: 'w-manner-22', word: 'よろしくお願いいたします', reading: 'よろしくおねがいいたします', meaning: '请多关照 (重复句型补全)' },
  { id: 'w-manner-23', word: 'お疲れ様でーす', reading: 'おつかれさまです', meaning: '辛苦了 (口语)' },
  { id: 'w-manner-24', word: 'ナイスです', reading: 'ナイスです', meaning: '干得好' },
  { id: 'w-manner-25', word: 'エビデンス', reading: 'エビデンス', meaning: '证据 / 截图证据' },
];

writeJson('words.json', words);
console.log(`  total words: ${words.length}`);

// ============ grammar.json ============
const grammar = [
  { id: 'g-01', pattern: '〜について', meaning: '关于...', example: 'この件について確認したいのですが。' },
  { id: 'g-02', pattern: '〜の件', meaning: '关于...的事', example: '○○の件でご連絡しました。' },
  { id: 'g-03', pattern: '〜していただけますか', meaning: '能请您...吗', example: 'ご確認いただけますか。' },
  { id: 'g-04', pattern: '〜いただけますでしょうか', meaning: '能否请您...吗 (更礼貌)', example: 'お時間いただけますでしょうか。' },
  { id: 'g-05', pattern: '〜と思います', meaning: '我觉得...', example: '原因はそこだと思います。' },
  { id: 'g-06', pattern: '〜かと存じます', meaning: '我认为 (自谦)', example: '問題ないかと存じます。' },
  { id: 'g-07', pattern: '〜ようにしてください', meaning: '请按照...做', example: 'ブランチを切るようにしてください。' },
  { id: 'g-08', pattern: '〜の場合は', meaning: '在...的情况下', example: 'エラーが発生した場合は連絡してください。' },
  { id: 'g-09', pattern: '〜する予定でおります', meaning: '我计划...', example: '来週リリースする予定でおります。' },
  { id: 'g-10', pattern: '〜する必要があります', meaning: '有必要...', example: '再起動する必要があります。' },
  { id: 'g-11', pattern: '〜してもよろしいでしょうか', meaning: '可以...吗', example: 'リリースしてもよろしいでしょうか。' },
  { id: 'g-12', pattern: '〜のようにいたします', meaning: '我会...做', example: '本日中に対応いたします。' },
  { id: 'g-13', pattern: '〜の対応をお願いします', meaning: '请处理...', example: '至急の対応をお願いします。' },
  { id: 'g-14', pattern: '〜する際は', meaning: '做...的时候', example: 'マージする際はレビューが必要です。' },
  { id: 'g-15', pattern: '〜によると', meaning: '根据...', example: 'ログによると API 呼び出しが失敗しています。' },
  { id: 'g-16', pattern: '〜とのことでした', meaning: '据说...', example: '田中さんからは完了したとのことでした。' },
  { id: 'g-17', pattern: '〜ていただけますでしょうか', meaning: '能请您帮我...吗 (更礼貌)', example: 'PR をレビューしていただけますでしょうか。' },
  { id: 'g-18', pattern: '〜のか', meaning: '...的 (强调疑问)', example: '本当に不具合なのか、もう一度確認します。' },
  { id: 'g-19', pattern: '〜によって', meaning: '根据 / 由于', example: '環境によって動作が異なります。' },
  { id: 'g-20', pattern: '〜ことがあります', meaning: '有时候会...', example: '稀にタイムアウトになることがあります。' },
  { id: 'g-21', pattern: '〜のほう', meaning: '...那一边 (委婉指人)', example: '○○さんのほうにも共有しておきます。' },
  { id: 'g-22', pattern: '〜いただければと思います', meaning: '如果能...的话 (委婉请求)', example: '早めにご返信いただければと思います。' },
  { id: 'g-23', pattern: '〜いたす', meaning: '做 (自谦)', example: '確認いたしまして、追ってご連絡いたします。' },
  { id: 'g-24', pattern: '〜させていただく', meaning: '请允许我... (自谦)', example: '仕様について確認させていただきます。' },
  { id: 'g-25', pattern: '〜なんですが', meaning: '...是这样的 (犹豫开场)', example: '少し聞きたいんですが、お時間ありますか。' },
  { id: 'g-26', pattern: '〜ことになる', meaning: '就变成 / 决定', example: '来週からテスト環境で検証することになります。' },
  { id: 'g-27', pattern: '〜ようにする', meaning: '做到...', example: 'レビューコメントに対応するようにしています。' },
  { id: 'g-28', pattern: '〜ことになっている', meaning: '规定 / 预定', example: '本番リリース前に QA を行うことになっています。' },
  { id: 'g-29', pattern: '〜ております', meaning: '正在... (自谦)', example: '只今確認しております。' },
  { id: 'g-30', pattern: '〜いただけますと幸いです', meaning: '如能...则不胜感激', example: 'ご確認いただけますと幸いです。' },
];

writeJson('grammar.json', grammar);
console.log(`  total grammar: ${grammar.length}`);

// ============ dialogs.json ============
const dialogs = [
  {
    id: 'd-01',
    title: '朝会 / 站会汇报',
    participants: ['田中さん (リーダー)', '佐藤さん (エンジニア)'],
    lines: [
      { speaker: '田中', text: 'お疲れ様です。本日のスタンドアップ始めますね。' },
      { speaker: '田中', text: '佐藤さん、昨日のおさらいと今日やることを教えてもらえますか。' },
      { speaker: '佐藤', text: 'はい、昨日はユーザーログイン API の実装を完了して、ユニットテストも通っています。' },
      { speaker: '佐藤', text: '今日はコードレビューをいただいて、本番反映に進む予定です。' },
      { speaker: '田中', text: 'ありがとうございます。ブロッカーは何かありますか。' },
      { speaker: '佐藤', text: 'とくにありません。レビューが返ってきたらすぐ対応します。' },
      { speaker: '田中', text: '了解です。お疲れ様でした。' },
    ],
  },
  {
    id: 'd-02',
    title: 'Slack で工单確認',
    participants: ['佐藤', '山田さん (PO)'],
    lines: [
      { speaker: '佐藤', text: '山田さん、お疲れ様です。JIRA の ABC-123 の件でご相談したいのですが。' },
      { speaker: '山田', text: 'はい、お疲れ様です。なんでしょうか。' },
      { speaker: '佐藤', text: '仕様の 3 ページ目の「ユーザー登録時のメール認証」について確認したいんです。' },
      { speaker: '佐藤', text: '認証コードの有効期限って、何分に設定すればよろしいでしょうか。' },
      { speaker: '山田', text: 'あ、それは 5 分でお願いします。' },
      { speaker: '佐藤', text: '承知しました。5 分で実装します。ありがとうございます。' },
      { speaker: '山田', text: 'よろしくお願いします。' },
    ],
  },
  {
    id: 'd-03',
    title: 'コードレビュー / PR 反馈',
    participants: ['佐藤 (PR 作者)', '鈴木さん (レビュアー)'],
    lines: [
      { speaker: '佐藤', text: '鈴木さん、お疲れ様です。PR 出したのでレビューいただけますでしょうか。' },
      { speaker: '鈴木', text: 'はい、見ますね。少し待ってください。' },
      { speaker: '鈴木', text: '全体的にいいと思いますが、2 点コメントしました。' },
      { speaker: '鈴木', text: '1 点目は、認証の try-catch で例外を握りつぶさずに、ちゃんと上位に投げてください。' },
      { speaker: '鈴木', text: '2 点目は、変数名が `data` だと何のデータか分からないので、もう少し具体的な名前にしてください。' },
      { speaker: '佐藤', text: 'ご指摘ありがとうございます。1 点目、確かにログだけだと原因追えないので、エラーを投げるように修正します。' },
      { speaker: '佐藤', text: '2 点目、`userAuthData` のようにリネームしようと思います。' },
      { speaker: '鈴木', text: 'はい、お願いします。修正したらまた声かけてください。' },
    ],
  },
  {
    id: 'd-04',
    title: 'クライアントとの打ち合わせ',
    participants: ['佐藤', '山田さん (PM)', '中村さん (クライアント)'],
    lines: [
      { speaker: '山田', text: '中村さん、本日はお忙しいところありがとうございます。' },
      { speaker: '中村', text: 'こちらこそ、よろしくお願いします。' },
      { speaker: '山田', text: '本日のアジェンダは 3 点で、まず新機能の概要、次にスケジュール、最後に質疑応答となっております。' },
      { speaker: '佐藤', text: '機能概要のほう、私から説明させていただきます。' },
      { speaker: '佐藤', text: '今回追加する機能は、ユーザーが CSV ファイルをアップロードして、一括でデータを登録できるというものです。' },
      { speaker: '中村', text: 'なるほど。アップロードできるファイルサイズに上限はありますか。' },
      { speaker: '佐藤', text: 'はい、申し訳ございません、現時点では 10MB までを予定しております。' },
      { speaker: '中村', text: '承知しました。100MB くらいまで欲しいので、可能であれば検討いただけますでしょうか。' },
      { speaker: '山田', text: 'かしこまりました。社内に持ち帰りまして、可能かどうか調査してご報告いたします。' },
    ],
  },
  {
    id: 'd-05',
    title: '緊急バグ報告と対応',
    participants: ['佐藤', '田中さん (リーダー)'],
    lines: [
      { speaker: '佐藤', text: '田中さん、至急お伝えしたいことがあります。本番環境で障害が発生しています。' },
      { speaker: '田中', text: '了解しました。状況を教えてもらえますか。' },
      { speaker: '佐藤', text: 'はい、決済 API が 500 エラーを返していて、ユーザーの購入処理ができない状態です。' },
      { speaker: '佐藤', text: '15 時頃から発生していて、現在も継続中です。' },
      { speaker: '田中', text: '影響範囲はどのくらいですか。' },
      { speaker: '佐藤', text: 'ログを確認したところ、現時点で 約 200 件の購入が失敗しています。' },
      { speaker: '田中', text: 'それは深刻ですね。すぐにロールバックしましょう。佐藤さん、ロールバック対応をお願いします。' },
      { speaker: '佐藤', text: '承知しました。ただいまロールバック作業に入ります。' },
      { speaker: '田中', text: 'ありがとうございます。私も Csirt チームに連絡して、関係各位に連絡します。' },
    ],
  },
  {
    id: 'd-06',
    title: '週次進捗報告',
    participants: ['田中 (マネージャー)', '佐藤', '鈴木'],
    lines: [
      { speaker: '田中', text: '本日の週次会議を始めます。佐藤さん、今週の進捗お願いします。' },
      { speaker: '佐藤', text: 'はい。今週はユーザー管理機能の実装を進めまして、予定通り完了しました。' },
      { speaker: '佐藤', text: '来週は検索機能の実装に入る予定です。' },
      { speaker: '田中', text: 'ありがとうございます。鈴木さんのほうはいかがでしょうか。' },
      { speaker: '鈴木', text: '私のほうは今週、画像アップロード機能のリファクタリングを行っておりまして、来週前半で完了見込みです。' },
      { speaker: '田中', text: '了解です。何かブロッカーはありますか。' },
      { speaker: '佐藤', text: 'とくにありません。' },
      { speaker: '鈴木', text: '一点、画像処理のライブラリ選定で迷っていて、相談したいです。' },
      { speaker: '田中', text: 'では、後ほど時間を取って別途ミーティングしましょう。' },
    ],
  },
  {
    id: 'd-07',
    title: '1on1 面談',
    participants: ['佐藤', '田中 (上司)'],
    lines: [
      { speaker: '田中', text: '佐藤さん、今月の 1on1 ですね。最近の調子はどうですか。' },
      { speaker: '佐藤', text: 'ありがとうございます。業務には慣れました。少しずつ任される範囲が広がって、やりがいを感じています。' },
      { speaker: '田中', text: 'それはよかったです。困っていることや、不安なことはありますか。' },
      { speaker: '佐藤', text: '一つあるとすれば、技術的に難しい案件が来たときに、相談する相手が少なく感じることです。' },
      { speaker: '田中', text: 'なるほど。では、来月からは週に 1 回、技術的な相談会を 30 分設けるのはどうですか。' },
      { speaker: '佐藤', text: 'それは助かります。ぜひお願いしたいです。' },
      { speaker: '田中', text: '了解しました。それでは来週から設定しますね。他にはありますか。' },
      { speaker: '佐藤', text: 'いいえ、今日は以上です。ありがとうございました。' },
    ],
  },
  {
    id: 'd-08',
    title: '残業の相談',
    participants: ['佐藤', '田中 (上司)'],
    lines: [
      { speaker: '佐藤', text: '田中さん、少しお時間よろしいでしょうか。' },
      { speaker: '田中', text: 'はい、何でしょうか。' },
      { speaker: '佐藤', text: '実は、今週の金曜納期の案件で、進捗が遅れていまして。' },
      { speaker: '佐藤', text: '今週ちょっと残業させていただけないか相談したく。' },
      { speaker: '田中', text: 'なるほど。状況と理由を教えてもらえますか。' },
      { speaker: '佐藤', text: 'はい、当初見積もりの工数より、想定外の連携先の API 仕様が複雑で、3 日ほど余分にかかっています。' },
      { speaker: '田中', text: '分かりました。金曜までは残業で対応してください。' },
      { speaker: '田中', text: 'ただ、来週以降、同じことが起きないように、見積もり段階でリスクも上げてくれると助かります。' },
      { speaker: '佐藤', text: '承知しました。以後気を付けます。ありがとうございます。' },
    ],
  },
];

writeJson('dialogs.json', dialogs);
console.log(`  total dialogs: ${dialogs.length} (lines: ${dialogs.reduce((a, d) => a + d.lines.length, 0)})`);

// ============ listening.json ============
const listening = [
  { id: 'l-01', title: 'スタンダップ通知 (Slack)', text: '@channel お疲れ様です。10時15分から本日のスタンダアップミーティングを始めます。' },
  { id: 'l-02', title: '進捗報告 (朝会)', text: '昨日はユーザーログイン機能を完了し、今日はAPIの結合テストを行う予定です。' },
  { id: 'l-03', title: 'PR 提出の連絡', text: 'お疲れ様です。決済機能のリファクタリングのPRを出しました。レビューのほどよろしくお願いします。' },
  { id: 'l-04', title: 'PR レビューコメント', text: 'PR確認しました。全体的に良いと思いますが、変数名をもう少し具体的にしたほうが可読性が上がると思います。' },
  { id: 'l-05', title: 'クライアントからのメール (依頼)', text: 'いつもお世話になっております。来週の水曜日にオンライン会議をお願いしたく、ご都合いかがでしょうか。' },
  { id: 'l-06', title: 'クライアントとの会議 (冒頭)', text: 'お忙しいところお集まりいただきありがとうございます。本日のアジェンダは3点ございます。' },
  { id: 'l-07', title: '仕様変更の連絡', text: 'お疲れ様です。先ほどの打ち合わせの通り、CSVアップロードの上限を100MBに変更させていただきます。' },
  { id: 'l-08', title: 'Slack で質問', text: 'すみません、少し教えていただきたいんですが、本番反映って今日と明日のどちらがよろしいでしょうか。' },
  { id: 'l-09', title: '緊急障害発生 (一次連絡)', text: '@channel 緊急連絡です。本番環境で決済APIが500エラーを返しています。購入処理ができない状態です。' },
  { id: 'l-10', title: '障害復旧の連絡', text: 'お疲れ様です。先ほどの障害について、ロールバックが完了し、現在は復旧しております。ご迷惑をおかけしました。' },
  { id: 'l-11', title: '週次進捗報告', text: '今週はユーザー管理機能の実装を予定通り完了しました。来週は検索機能の実装に入る予定です。' },
  { id: 'l-12', title: '1on1 での質問', text: '佐藤さん、最近の業務で感じている課題や不安なことは何かありますか。' },
  { id: 'l-13', title: '残業の相談 (返事)', text: '進捗の件、了解しました。金曜日までは残業で対応してください。ただし、次回からは見積もり段階でリスクも報告してください。' },
  { id: 'l-14', title: '新人オンボーディング (導入)', text: '佐藤さん、本日から入社ですね。最初の1週間はチームのメンバー紹介と、開発環境のセットアップを行います。' },
  { id: 'l-15', title: '週会の冒頭', text: 'お疲れ様です。週次会議を始めます。本日のアジェンダは進捗報告と、来週リリース予定の案件の最終確認です。' },
];

writeJson('listening.json', listening);
console.log(`  total listening: ${listening.length}`);

// ============ quiz.json (空壳, 后面由 gen-word-grammar-quiz 填充) ============
writeJson('quiz.json', []);

console.log('\n所有 it-work 数据文件生成完毕。');
