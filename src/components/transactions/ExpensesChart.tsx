
"use client";

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "@/contexts/LanguageContext";
import type { Transaction } from "@/types";
import { ListTree } from "lucide-react";

interface ExpensesChartProps {
  transactions: Transaction[];
  categoryIdToNameMap: Record<string, string>;
}

const COLORS = [
  "#1E3A8A", // primary
  "#3B82F6", // accent
  "#60A5FA", // A lighter blue
  "#10B981", // A nice green
  "#F59E0B", // A warm amber/orange
  "#8B5CF6", // A vibrant violet
  "#EC4899", // A vivid pink
  "#6366F1", // A friendly indigo
  "#F43F5E", // A strong rose
];

export function ExpensesChart({ transactions, categoryIdToNameMap }: ExpensesChartProps) {
  const { translations, translateCategory } = useTranslations();

  const chartData = React.useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const categoryTotals = expenses.reduce((acc, transaction) => {
      const categoryKey = categoryIdToNameMap[transaction.categoryId] || "Unknown";
      const translatedCategory = translateCategory(categoryKey);
      acc[translatedCategory] = (acc[translatedCategory] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        fill: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categoryIdToNameMap, translateCategory]);
  
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach((data, index) => {
        config[data.category] = {
            label: data.category,
            color: COLORS[index % COLORS.length],
        };
    });
    return config;
  }, [chartData]);


  if (chartData.length === 0) {
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
    }).format(value);
  };

  return (
    <div className="h-[300px] md:h-[350px] w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <PieChart>
          <Tooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => {
                    const categoryName = chartConfig[name as string]?.label || name;
                    const formattedValue = formatCurrency(value as number);
                    return (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{`${categoryName}:`}</span>
                            <span className="text-muted-foreground">{formattedValue}</span>
                        </div>
                    );
                }}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            innerRadius="60%"
            paddingAngle={5}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
              payload
            }) => {
              if (percent < 0.05) return null;
              const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text
                  x={x}
                  y={y}
                  fill="hsl(var(--foreground))"
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  className="text-xs font-bold"
                >
                   {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={chartConfig[entry.category]?.color}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
}
