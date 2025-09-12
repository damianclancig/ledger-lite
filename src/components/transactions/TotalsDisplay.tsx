
"use client";

import type { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface TotalsDisplayProps {
  transactions: Transaction[];
}

export function TotalsDisplay({ transactions }: TotalsDisplayProps) {
  const { translations } = useTranslations();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="grid gap-6 md:grid-cols-1">
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium">{translations.totalIncome}</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-green-600 dark:text-green-400 font-mono">
            {formatCurrency(totalIncome)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium">{translations.totalExpenses}</CardTitle>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-center text-red-600 dark:text-red-400 font-mono">
            {formatCurrency(totalExpenses)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium">Balance</CardTitle>
          <DollarSign className={`h-5 w-5 ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-xl md:text-2xl font-bold text-center ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} font-mono`}>
            {formatCurrency(balance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
