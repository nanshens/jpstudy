import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, BookOpen, MessageCircle, Headphones, ClipboardCheck } from 'lucide-react';
import type { ScenarioData } from '@/types';
import { getProgress } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

export function Overview({ data }: { data: ScenarioData }) {
  const progress = getProgress(data.meta.id);
  const totalItems = data.words.length + data.grammar.length + data.dialogs.length + data.listening.length;
  const visited = progress.visitedTabs.length;
  const known = progress.knownWords.length;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> 学习目标
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ModuleCard to={`/scenarios/${data.meta.id}`} icon={BookOpen} label="单词" value={data.words.length} sub={`已掌握 ${known}`} progressValue={data.words.length ? (known / data.words.length) * 100 : 0} />
        <ModuleCard to={`/scenarios/${data.meta.id}`} icon={MessageCircle} label="对话" value={data.dialogs.length} sub="段真实对话" />
        <ModuleCard to={`/scenarios/${data.meta.id}`} icon={Headphones} label="听力" value={data.listening.length} sub="道 TTS 题" />
        <ModuleCard to={`/scenarios/${data.meta.id}`} icon={ClipboardCheck} label="小测" value={data.quiz.length} sub={progress.quizBest ? `最佳 ${progress.quizBest} / ${data.quiz.length}` : '未开始'} />
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
          <p>⑥ <strong>小测</strong>做一遍检验效果,错题回到单词/语法复习</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({ icon: Icon, label, value, sub, progressValue, to }: any) {
  return (
    <Link to={to} className="block">
      <Card className="p-4 hover:shadow-md transition-all hover:border-primary/50 h-full">
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
    </Link>
  );
}
