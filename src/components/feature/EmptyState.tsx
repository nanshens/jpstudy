import { Card } from '@/components/ui/card';
import { MessageSquare, Headphones, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  title?: string;
  description?: string;
  /** 用于判断当前空态对应哪个模块(影响 icon 和提示) */
  scenarioId?: string;
  /** 列表形式时,显示的"如何添加"小提示 */
  hint?: string;
  className?: string;
}

/**
 * 场景模块数据为空时的友好提示
 * - 对话/听力等模块的"暂无内容"状态
 * - 不至于让页面崩,也不让用户看到空荡的页面
 */
export function EmptyState({
  title = '暂无内容',
  description,
  scenarioId,
  hint,
  className,
}: Props) {
  // 根据 scenarioId 选个对应模块的 icon
  const Icon = scenarioId === 'listening' ? Headphones : MessageSquare;
  return (
    <Card className={cn('p-8 text-center', className)}>
      <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {hint && (
        <p className="text-xs text-muted-foreground/80 mt-3 max-w-md mx-auto">
          <Icon className="inline h-3.5 w-3.5 mr-1" />
          {hint}
        </p>
      )}
    </Card>
  );
}
