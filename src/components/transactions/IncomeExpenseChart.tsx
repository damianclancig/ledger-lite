"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { useTranslations } from "@/contexts/LanguageContext";
import { ListTree } from "lucide-react";

interface ChartData {
    name: string;
    current: number;
    previous: number;
}

interface IncomeExpenseChartProps {
  chartData: ChartData[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
};

const CustomLegend = () => {
    const { translations } = useTranslations();
    const chartConfig = {
        income_current: { label: translations.currentMonth, color: "hsl(var(--chart-2))" },
        income_previous: { label: translations.previousMonth, color: "hsl(var(--chart-2) / 0.5)" },
        expense_current: { label: translations.currentMonth, color: "hsl(var(--destructive))" },
        expense_previous: { label: translations.previousMonth, color: "hsl(var(--destructive) / 0.5)" },
    };

    return (
        <div className="flex justify-center items-start gap-8 mt-4 text-sm">
            <div className="flex flex-col items-start gap-2">
                <div className="font-bold">{translations.income}</div>
                <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, backgroundColor: chartConfig.income_current.color, borderRadius: '2px' }} />
                    <span className="text-muted-foreground">{chartConfig.income_current.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, backgroundColor: chartConfig.income_previous.color, borderRadius: '2px' }} />
                    <span className="text-muted-foreground">{chartConfig.income_previous.label}</span>
                </div>
            </div>
            <div className="flex flex-col items-start gap-2">
                <div className="font-bold">{translations.expense}</div>
                <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, backgroundColor: chartConfig.expense_current.color, borderRadius: '2px' }} />
                    <span className="text-muted-foreground">{chartConfig.expense_current.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div style={{ width: 12, height: 12, backgroundColor: chartConfig.expense_previous.color, borderRadius: '2px' }} />
                    <span className="text-muted-foreground">{chartConfig.expense_previous.label}</span>
                </div>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const { translations } = useTranslations();
  if (active && payload && payload.length) {
    const isIncome = label === translations.income;
    const title = isIncome ? translations.income : translations.expense;
    
    // payload[0] is for 'previous', payload[1] is for 'current'
    const previousValue = payload[0]?.value || 0;
    const currentValue = payload[1]?.value || 0;

    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-xl">
        <p className="mb-2 font-medium">{title}</p>
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{translations.currentMonth}:</span>
                <span className="font-mono font-medium">{formatCurrency(currentValue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{translations.previousMonth}:</span>
                <span className="font-mono font-medium">{formatCurrency(previousValue)}</span>
            </div>
        </div>
      </div>
    );
  }

  return null;
};


export function IncomeExpenseChart({ chartData }: IncomeExpenseChartProps) {
  const { translations } = useTranslations();

  const chartConfig = React.useMemo(() => ({
    income: { color: "hsl(var(--chart-2))" },
    income_muted: { color: "hsl(var(--chart-2) / 0.5)" },
    expense: { color: "hsl(var(--destructive))" },
    expense_muted: { color: "hsl(var(--destructive) / 0.5)" },
  }), []) satisfies ChartConfig;

  const noData = chartData.every(d => d.current === 0 && d.previous === 0);

  if (noData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-muted-foreground text-center">
        <ListTree className="w-10 h-10 mb-2" />
        <p className="text-base">{translations.noTransactions}</p>
      </div>
    );
  }
  
  return (
    <div className="h-[350px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <BarChart 
            accessibilityLayer
            data={chartData}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
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
            tickFormatter={(value) => formatCurrency(value as number)}
            stroke="hsl(var(--foreground))"
          />
          <Tooltip
            cursor={{ fill: 'hsla(var(--background))' }}
            content={<CustomTooltip />}
          />
          <Legend content={<CustomLegend />} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
          
           <Bar dataKey="previous" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}-previous`} fill={entry.name === translations.income ? chartConfig.income_muted.color : chartConfig.expense_muted.color} />
            ))}
           </Bar>
           <Bar dataKey="current" radius={[4, 4, 0, 0]}>
             {chartData.map((entry, index) => (
                <Cell key={`cell-${index}-current`} fill={entry.name === translations.income ? chartConfig.income.color : chartConfig.expense.color} />
             ))}
           </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
