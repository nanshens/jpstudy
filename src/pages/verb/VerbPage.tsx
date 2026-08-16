import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Rocket, BookOpen, ListChecks, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader, PageError } from '@/components/feature/Loader';
import { loadVerbData } from '@/lib/loader';
import type { VerbData } from '@/types';

export function VerbPage() {
  const [data, setData] = useState<VerbData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadVerbData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? String(e)); });
    return () => { cancelled = true; };
  }, [retryKey]);

  if (error) {
    return <PageError message={`动词数据加载失败:${error}`} onRetry={() => { setError(null); setRetryKey((k) => k + 1); }} />;
  }
  if (!data) return <PageLoader label="加载动词数据…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">动词变形学习地图</h1>
        <p className="text-sm text-muted-foreground">
          三大模块:练习、基础复习、速查表，跟着节奏把动词变形从理解到应用一次打通。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 模块 1:千锤百炼 */}
        <Card className="p-6 space-y-3 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
            <Rocket className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">🚀 千锤百炼,练就完了</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>🎯 1000+ 题库覆盖 13 种形态</li>
            <li>📝 随选题量,错题与新题都能练</li>
            <li>♾️ 一站式进入练习模式,节奏更稳</li>
          </ul>
          <Link to="/verbs/practice">
            <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
              开始练习 →
            </Button>
          </Link>
        </Card>

        {/* 模块 2:基础知识 */}
        <Card className="p-6 space-y-3 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">📘 动词变形基础知识</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>⏰ 基础动词变形知识一站掌握</li>
            <li>🧩 规则 + 易错点一并梳理</li>
            <li>📋 搭配例句,快速理解用法</li>
          </ul>
          <Link to="/verbs/basics">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              去看讲解 →
            </Button>
          </Link>
        </Card>

        {/* 模块 3:速查表 */}
        <Card className="p-6 space-y-3 hover:shadow-lg transition-all">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
            <ListChecks className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">📋 动词变形速查表</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>⚡ 场景动词变形一览无余</li>
            <li>🔄 速查 + 默写双模式切换</li>
            <li>🎯 薄弱点一眼定位,练就有效</li>
          </ul>
          <Link to="/verbs/cheatsheet">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              打开速查表 →
            </Button>
          </Link>
        </Card>
      </div>

      {/* 13 种变形快速入口 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">13 种变形 · 直接进入</span>
          <Link to="/verbs/forms" className="text-xs text-primary hover:underline ml-auto">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {data.forms.map((f) => (
            <Link
              key={f.id}
              to={`/verbs/forms#${f.id}`}
              className="group block"
            >
              <Card className="p-3 text-center hover:shadow-md hover:border-primary/50 transition-all">
                <div className={`h-8 w-8 mx-auto rounded-md bg-gradient-to-br ${f.color} flex items-center justify-center text-white text-sm mb-1.5`}>
                  {f.emoji}
                </div>
                <div className="text-xs font-medium leading-tight">{f.name}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
