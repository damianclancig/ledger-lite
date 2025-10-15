
"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useTranslations } from "@/contexts/LanguageContext";
import { ListTree } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

export interface DailyExpensesData {
    name: string;
    amount: number;
}

interface DailyExpensesChartProps {
  chartData: DailyExpensesData[];
}

const formatCurrencyK = (value: number): string => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-xl">
        <p className="mb-2 font-medium capitalize">{label}</p>
        <div className="flex items-center justify-between gap-4">
            <span className="font-mono font-medium">{formatCurrency(payload[0].value)}</span>
        </div>
      </div>
    );
  }

  return null;
};

export function DailyExpensesChart({ chartData }: DailyExpensesChartProps) {
  const { translations } = useTranslations();

  const chartConfig = React.useMemo(() => ({
    today: {
      label: translations.today,
      color: "hsl(var(--destructive))",
    },
    yesterday: {
      label: translations.yesterday,
      color: "hsl(var(--destructive) / 0.5)",
    },
  }), [translations]) satisfies ChartConfig;

  const noData = chartData.every(d => d.amount === 0);

  if (noData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-muted-foreground text-center">
        <ListTree className="w-10 h-10 mb-2" />
        <p className="text-base">{translations.noTransactions}</p>
      </div>
    );
  }
  
  return (
    <div className="h-[300px] md:h-[350px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart 
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            barSize={60}
        >
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrencyK(value as number)}
            stroke="hsl(var(--foreground))"
          />
          <Tooltip
            cursor={{ fill: 'hsla(var(--background))' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
                <Cell 
                    key={`cell-${entry.name}`} 
                    fill={entry.name === translations.today ? chartConfig.today.color : chartConfig.yesterday.color}
                />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
