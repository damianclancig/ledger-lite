
"use client";

import * as React from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import type { SavingsFund } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SavingsFundsProgressChartProps {
  funds: SavingsFund[];
}

export function SavingsFundsProgressChart({ funds }: SavingsFundsProgressChartProps) {
  const { translations } = useTranslations();
  
  const chartData = React.useMemo(() => {
    return funds
      .filter(fund => fund.targetAmount > 0)
      .map(fund => {
        const progress = (fund.currentAmount / fund.targetAmount) * 100;
        return {
          name: fund.name,
          progress: Math.min(100, progress),
          currentAmount: fund.currentAmount,
          targetAmount: fund.targetAmount,
          isCompleted: fund.currentAmount >= fund.targetAmount,
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [funds]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-muted-foreground text-center">
        <PiggyBank className="w-10 h-10 mb-2" />
        <p className="text-base">{translations.noSavingsFundsProgress}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chartData.map((fund) => (
        <div key={fund.name}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-base font-medium truncate pr-2">{fund.name}</span>
            <span className="text-sm font-medium text-muted-foreground">{fund.progress.toFixed(0)}%</span>
          </div>
          <Progress value={fund.progress} className={cn("h-3", fund.isCompleted && "[&>div]:bg-green-600")} />
          <div className="flex justify-between items-start mt-1 text-xs font-mono">
            <span>{formatCurrency(fund.currentAmount)}</span>
            <span className="text-muted-foreground">{translations.target}: {formatCurrency(fund.targetAmount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

    