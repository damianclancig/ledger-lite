
"use client";

import * as React from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import type { SavingsFund } from "@/types";
import { PiggyBank } from "lucide-react";
import { SavingsFundProgress } from "@/components/savings-funds/SavingsFundProgress";

interface SavingsFundsProgressChartProps {
  funds: SavingsFund[];
}

export function SavingsFundsProgressChart({ funds }: SavingsFundsProgressChartProps) {
  const { translations } = useTranslations();
  
  const chartData = React.useMemo(() => {
    return funds
      .filter(fund => fund.targetAmount > 0)
      .sort((a, b) => {
          const progressA = (a.currentAmount / a.targetAmount);
          const progressB = (b.currentAmount / b.targetAmount);
          return progressB - progressA;
      });
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
         <SavingsFundProgress key={fund.id} fund={fund} size="sm" />
      ))}
    </div>
  );
}
