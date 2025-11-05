
"use client";

import * as React from "react";
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, Dot } from "recharts";
import { useTranslations } from "@/contexts/LanguageContext";
import { ListTree, MousePointerClick } from "lucide-react";
import type { InstallmentProjection } from "@/types";
import { format, parse, isSameMonth } from "date-fns";
import { es, pt, enUS } from 'date-fns/locale';
import { formatCurrency, formatCurrencyK } from "@/lib/utils";

interface InstallmentProjectionChartProps {
  data: InstallmentProjection[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { language } = useTranslations();
  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  if (active && payload && payload.length) {
    const month = format(parse(payload[0].payload.month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: currentLocale });
    const total = payload[0].value;

    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-xl">
        <p className="mb-2 font-medium capitalize">{month}</p>
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-mono font-medium">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }

  return null;
};

const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const now = new Date();
    const dotMonth = parse(payload.month, 'yyyy-MM', new Date());

    if (isSameMonth(dotMonth, now)) {
        return <Dot cx={cx} cy={cy} r={8} fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth={2} />;
    }

    return <Dot cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" />;
};


export function InstallmentProjectionChart({ data }: InstallmentProjectionChartProps) {
  const { translations, language } = useTranslations();
  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  
  const noData = data.every(d => d.total === 0);
  
  const chartData = data.map(d => ({
      ...d,
      formattedMonth: format(parse(d.month, 'yyyy-MM', new Date()), 'MMM', { locale: currentLocale })
  }))

  if (noData) {
    return (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-center p-4 min-h-[200px]">
            <MousePointerClick className="w-10 h-10 mb-4" />
            <p className="text-base font-semibold mb-2">{translations.noInstallmentsTitle}</p>
            <p className="text-sm">{translations.noInstallmentsDesc}</p>
        </div>
    );
  }
  
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="formattedMonth"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: 'hsl(var(--foreground))' }}
            className="capitalize"
          />
          <YAxis 
            tickFormatter={(value) => formatCurrencyK(value as number)}
            stroke="hsl(var(--foreground))"
          />
          <Tooltip
            cursor={{ fill: 'hsla(var(--background))' }}
            content={<CustomTooltip />}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={<CustomizedDot />}
            activeDot={{ r: 8, stroke: "hsl(var(--background))", strokeWidth: 2, fill: "hsl(var(--accent))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
