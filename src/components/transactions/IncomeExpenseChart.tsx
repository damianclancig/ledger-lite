
"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Transaction } from "@/types";
import { ListTree } from "lucide-react";

interface IncomeExpenseChartProps {
  transactions: Transaction[];
}

export function IncomeExpenseChart({ transactions }: IncomeExpenseChartProps) {
  const { translations } = useTranslations();

  const chartData = React.useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return [{ 
      name: "Totals",
      income: totalIncome, 
      expense: totalExpenses 
    }];
  }, [transactions]);

  const chartConfig = {
    income: {
      label: translations.income,
      color: "hsl(var(--chart-2))",
    },
    expense: {
      label: translations.expense,
      color: "hsl(0, 84.2%, 60.2%)", // Destructive red
    },
  } satisfies ChartConfig;

  if (chartData[0].income === 0 && chartData[0].expense === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-muted-foreground text-center">
        <ListTree className="w-10 h-10 mb-2" />
        <p className="text-base">{translations.noTransactions}</p>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="h-[350px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart 
            accessibilityLayer
            data={chartData}
            barGap={5}
            barCategoryGap={0}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            stroke="hsl(var(--foreground))"
            tick={false}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value as number)}
            stroke="hsl(var(--foreground))"
          />
          <Tooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                hideLabel
                 formatter={(value, name) => {
                    const label = chartConfig[name as keyof typeof chartConfig]?.label;
                    const formattedValue = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value as number);
                    return (
                       <div className="flex items-center gap-2">
                            <span className="font-semibold">{label}:</span>
                            <span className="text-muted-foreground">{formattedValue}</span>
                        </div>
                    )
                }}
              />
            }
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={4} maxBarSize={50} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={4} maxBarSize={50} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
