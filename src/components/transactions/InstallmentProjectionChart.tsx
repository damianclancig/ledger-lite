
"use client";

import * as React from "react";
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Dot } from "recharts";
import { useTranslations } from "@/contexts/LanguageContext";
import { MousePointerClick } from "lucide-react";
import type { InstallmentProjection } from "@/types";
import { es, pt, enUS } from 'date-fns/locale';
import { formatCurrency, formatCurrencyK } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";

interface InstallmentProjectionChartProps {
  data: InstallmentProjection[];
}

const CustomTooltip = ({ active, payload }: any) => {
  const { language } = useTranslations();
  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  if (active && payload && payload.length) {
    // We pass the full yyyy-MM as the payload month, need to make it a full date for formatting
    const dateStr = `${payload[0].payload.month}-01T00:00:00.000Z`;
    const month = formatDateSafe(dateStr, 'MMMM yyyy', currentLocale);
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
    // Assuming payload.month is 'YYYY-MM'
    const dotMonthYear = parseInt(payload.month.substring(0, 4));
    const dotMonthMonth = parseInt(payload.month.substring(5, 7)) - 1;

    if (now.getFullYear() === dotMonthYear && now.getMonth() === dotMonthMonth) {
        return <Dot cx={cx} cy={cy} r={8} fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth={2} />;
    }

    return <Dot cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" />;
};


export function InstallmentProjectionChart({ data }: InstallmentProjectionChartProps) {
  const { translations, language } = useTranslations();
  const locales = { en: enUS, es, pt };
  const currentLocale = locales[language] || enUS;
  
  const noData = data.every(d => d.total === 0);
  
  const chartData = data.map(d => {
    // Convert "YYYY-MM" to a full date string for formatDateSafe
    const dateStr = `${d.month}-01T00:00:00.000Z`;
    return {
      ...d,
      formattedMonth: formatDateSafe(dateStr, 'MMM yyyy', currentLocale)
    };
  });

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
            interval="preserveStartEnd"
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
