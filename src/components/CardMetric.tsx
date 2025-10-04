import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface CardMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  icon?: ReactNode;
}

export function CardMetric({ label, value, unit, tooltip, variant = 'default', icon }: CardMetricProps) {
  const variantClasses = {
    default: 'border-primary/20 bg-card',
    warning: 'border-warn/30 bg-warn/5',
    danger: 'border-err/30 bg-err/5',
    success: 'border-ok/30 bg-ok/5',
  };

  const valueClasses = {
    default: 'text-foreground',
    warning: 'text-warn',
    danger: 'text-err',
    success: 'text-ok',
  };

  return (
    <Card className={`${variantClasses[variant]} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {tooltip && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm">{tooltip}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold tabular-nums ${valueClasses[variant]}`}>
                {value}
              </span>
              {unit && (
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
