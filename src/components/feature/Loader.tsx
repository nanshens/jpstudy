import { Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PageLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex justify-center py-20">
      <Card className="p-6 max-w-md w-full text-center space-y-3">
        <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm text-primary underline underline-offset-2"
          >
            重试
          </button>
        )}
      </Card>
    </div>
  );
}
