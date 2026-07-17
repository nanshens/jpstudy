import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  pdfUrl: string;
  label?: string;
  /** 同目录下的图片列表(供"题图参考"使用) */
  imageList?: { src: string; label: string }[];
}

/**
 * 教材 tab 内容:
 *  - 上方 PDF 浏览器内嵌查看(Chrome 自带 PDF viewer)
 *  - 下方题图缩略图(若提供)可点击放大
 *  - 顶部控制条:在新窗口打开 / 下载 / 缩放
 */
export function Textbook({ pdfUrl, label, imageList }: Props) {
  const [scale, setScale] = useState<number>(1); // 0.5 - 1.5
  const [fullscreen, setFullscreen] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);

  const filename = label ?? pdfUrl.split('/').pop() ?? '教材.pdf';

  // PDF 浏览器内嵌查看用 hash 控制 #zoom=...
  // Chrome 原生 PDF viewer 接受 #page= & #zoom=
  const pdfSrc = scale !== 1 ? `${pdfUrl}#zoom=${Math.round(scale * 100)}` : pdfUrl;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <span className="font-medium truncate">{filename}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                aria-label="缩小"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2)))}
                aria-label="放大"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFullscreen((f) => !f)}
                aria-label="全屏"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> 新窗口打开
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={pdfUrl} download={filename}>
                  <Download className="h-4 w-4" /> 下载
                </a>
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'rounded-md border bg-muted/30 overflow-hidden',
              fullscreen ? 'h-[80vh]' : 'h-[60vh] md:h-[70vh]',
            )}
          >
            <iframe
              key={pdfSrc}
              src={pdfSrc}
              title={filename}
              className="w-full h-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            提示:在 PDF 视图里可以滚动翻页、缩放、搜索关键词(右上角放大镜)。如浏览器无内置 PDF viewer,
            可点「在新窗口打开」或「下载」查看。
          </p>
        </CardContent>
      </Card>

      {/* 题图参考(若提供) */}
      {imageList && imageList.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">题图参考(仮免学科試験練習問題 1-5)</h3>
            <p className="text-xs text-muted-foreground">
              共 {imageList.length} 张,点击放大查看。每套题 50 道,带官方答案标记。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {imageList.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => setActiveImg(img.src)}
                  className="group relative aspect-[3/4] rounded-md overflow-hidden border bg-muted hover:border-primary transition-colors"
                >
                  <img
                    src={img.src}
                    alt={img.label}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate">
                    {img.label}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 题图放大弹层 */}
      {activeImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActiveImg(null)}
        >
          <img
            src={activeImg}
            alt=""
            className="max-w-full max-h-full rounded shadow-2xl"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4"
            onClick={() => setActiveImg(null)}
          >
            关闭
          </Button>
        </div>
      )}
    </div>
  );
}
