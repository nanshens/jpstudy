import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Languages, Volume2, GraduationCap, MessageCircle, Headphones, ClipboardCheck, Sparkles, Car } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/speech';

export function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-10">
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>🇯🇵 日本生活</span>
          <span>·</span>
          <span>驾考特训模式</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
          听懂教官的每一句日语,<br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            把驾照拿到手。
          </span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
          基于真实场景的日语学习。每一个场景都包含 <strong>单词 · 语法 · 对话 · 听力 · 小测</strong>,
          配合浏览器 TTS 实时发音,从"看"到"听"到"说",一个 app 全搞定。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/scenarios">
              <Car className="h-4 w-4" /> 进入学习场景 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/kana">
              <Languages className="h-4 w-4" /> 五十音图对照
            </Link>
          </Button>
        </div>
      </section>

      {/* 五大模块说明 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">每个场景包含 5 个模块</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: BookOpen, title: '单词', desc: '按主题分类' },
            { icon: GraduationCap, title: '语法', desc: '从句子中学' },
            { icon: MessageCircle, title: '对话', desc: '真实场景' },
            { icon: Headphones, title: '听力', desc: 'TTS 朗读' },
            { icon: ClipboardCheck, title: '小测', desc: '检验效果' },
          ].map((m, i) => (
            <Card
              key={m.title}
              className={`p-4 text-center ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <m.icon className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="font-medium text-sm">{m.title}</div>
              <div className="text-xs text-muted-foreground">{m.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick demo */}
      <section>
        <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/50">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">快速试听</h3>
              <p className="text-sm text-muted-foreground mb-3">
                点击下方按钮,听一句教官会说的日语:
              </p>
              <div className="flex items-center gap-3 bg-background/60 rounded-md p-3">
                <Button
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => speak('ミラーを見てください。', { rate: 0.85 })}
                  aria-label="试听"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div>
                  <div className="jp font-medium">ミラーを見てください。</div>
                  <div className="text-xs text-muted-foreground">请看后视镜。</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
