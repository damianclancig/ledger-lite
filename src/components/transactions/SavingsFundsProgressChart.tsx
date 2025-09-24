
"use client";

import * as React from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import type { SavingsFund } from "@/types";
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

  // This component will now only render the progress bars if there are funds.
  // The empty state is handled by the parent component (dashboard page).
  if (chartData.length === 0) {
    return null; 
  }

  return (
    <div className="space-y-4">
      {chartData.map((fund) => (
         <SavingsFundProgress key={fund.id} fund={fund} size="sm" />
      ))}
    </div>
  );
}
