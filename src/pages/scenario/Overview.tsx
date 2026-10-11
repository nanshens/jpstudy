import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { House, BookOpen, GraduationCap, MessageCircle, Headphones, ClipboardCheck, Keyboard, FileText, type LucideIcon } from 'lucide-react';
import type { ScenarioData } from '@/types';
import { getProgress } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

type TabKey = 'overview' | 'textbook' | 'words' | 'grammar' | 'dialogs' | 'listening' | 'typing' | 'quiz';

interface Props {
  data: ScenarioData;
  onSwitchTab: (tab: TabKey) => void;
}

export function Overview({ data, onSwitchTab }: Props) {
  const progress = getProgress(data.meta.id);
  const known = progress.knownWords.length;

  // 所有入口卡片 (按 tab 顺序排列)
  const cards: Array<{
    tab: TabKey;
    icon: LucideIcon;
    label: string;
    value: number | string;
    sub: string;
    progressValue?: number;
    show: boolean;
  }> = [
    { tab: 'words', icon: BookOpen, label: '单词', value: data.words.length, sub: `已掌握 ${known}`, progressValue: data.words.length ? (known / data.words.length) * 100 : 0, show: true },
    { tab: 'grammar', icon: GraduationCap, label: '语法', value: data.grammar.length, sub: data.grammar.length ? '条语法点' : '暂无语法', show: data.grammar.length > 0 },
    { tab: 'dialogs', icon: MessageCircle, label: '对话', value: data.dialogs.length, sub: '段真实对话', show: data.dialogs.length > 0 },
    { tab: 'listening', icon: Headphones, label: '听力', value: data.listening.length, sub: '道 TTS 题', show: data.listening.length > 0 },
    { tab: 'typing', icon: Keyboard, label: '打字', value: data.words.length, sub: '词打字练习', show: data.words.length > 0 },
    { tab: 'quiz', icon: ClipboardCheck, label: '小测', value: data.quiz.length, sub: progress.quizBest ? `最佳 ${progress.quizBest} / ${data.quiz.length}` : '未开始', show: data.quiz.length > 0 },
    { tab: 'textbook', icon: FileText, label: '教材', value: data.meta.pdfLabel || 'PDF', sub: '点击阅读', show: !!data.meta.pdf },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <House className="h-5 w-5 text-primary" /> 学习目标
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.meta.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {i + 1}
                </span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">学习入口</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.filter((c) => c.show).map((c) => (
            <ModuleCard
              key={c.tab}
              icon={c.icon}
              label={c.label}
              value={c.value}
              sub={c.sub}
              progressValue={c.progressValue}
              onClick={() => onSwitchTab(c.tab)}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>学习建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>① 先看<strong>概览</strong>,了解这个场景要学什么</p>
          <p>② <strong>单词</strong>点卡片翻面看意思,会读就标 ✓</p>
          <p>③ <strong>语法</strong>结合句子记,不要死记</p>
          <p>④ <strong>对话</strong>整段播放,跟着念一遍</p>
          <p>⑤ <strong>听力</strong>听完再选,别偷看答案</p>
          <p>⑥ <strong>打字</strong>罗马字模式对照打,错了会标红</p>
          <p>⑦ <strong>小测</strong>做一遍检验效果,错题回到单词/语法复习</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ModuleCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  progressValue?: number;
  onClick: () => void;
}

function ModuleCard({ icon: Icon, label, value, sub, progressValue, onClick }: ModuleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left block w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <Card className="p-4 hover:shadow-md transition-all hover:border-primary/50 h-full group-hover:bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
        {progressValue !== undefined && (
          <Progress value={progressValue} className="mt-2" />
        )}
      </Card>
    </button>
  );
}