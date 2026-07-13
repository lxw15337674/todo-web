import { CopyIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface PolishCardProps {
  content: string;
}

export function PolishCard({ content }: PolishCardProps) {
  const styles = content.split(/\[.*?\]\n/).filter(Boolean);
  const styleNames = content.match(/\[(.*?)\]/g)?.map((item) => item.slice(1, -1)) || [];

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text.trim());
    toast({ description: '已复制到剪贴板' });
  };

  return (
    <div className="flex w-full min-w-0 flex-col">
      {styles.map((style, index) => (
        <div key={`${styleNames[index] ?? 'style'}-${index}`}>
          {index > 0 && <Separator />}
          <div className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {styleNames[index] && (
                <Badge variant="outline" className="w-fit">
                  {styleNames[index]}
                </Badge>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{style.trim()}</p>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`复制${styleNames[index] ?? '内容'}`}
                    onClick={() => handleCopy(style)}
                  />
                }
              >
                <CopyIcon />
              </TooltipTrigger>
              <TooltipContent>复制</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
